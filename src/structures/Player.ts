import { Manager, SearchQuery, SearchResult } from "./Manager";
import { Node } from "./Node";
import { Queue } from "./Queue";
import { Sizes, State, Structure, TrackUtils, VoiceState } from "./Utils";
import { GuildMember, Guild, TextChannel, VoiceChannel } from 'discord.js';

function check(options: PlayerOptions) {
  if (!options) throw new TypeError("PlayerOptions must not be empty.");

  if (!(options.guild instanceof Guild))
    throw new TypeError(
      'Player option "guild" must be present and be a discord "Guild".'
    );

  if (!(options.textChannel instanceof TextChannel))
    throw new TypeError(
      'Player option "textChannel" must be present and be a discord "TextChannel".'
    );

  if (!(options.voiceChannel instanceof VoiceChannel))
    throw new TypeError(
      'Player option "voiceChannel" must be present and be a discord "VoiceChannel".'
    );

  if (options.node && typeof options.node !== "string")
    throw new TypeError('Player option "node" must be a non-empty string.');

  if (
    typeof options.volume !== "undefined" &&
    typeof options.volume !== "number"
  )
    throw new TypeError('Player option "volume" must be a number.');

  if (
    typeof options.selfMute !== "undefined" &&
    typeof options.selfMute !== "boolean"
  )
    throw new TypeError('Player option "selfMute" must be a boolean.');

  if (
    typeof options.selfDeafen !== "undefined" &&
    typeof options.selfDeafen !== "boolean"
  )
    throw new TypeError('Player option "selfDeafen" must be a boolean.');
}

export type LoopState = "TRACK" | "QUEUE" | "DISABLED";

export class Player {
  /** The Queue for the Player. */
  public readonly queue = new (Structure.get("Queue"))() as Queue;
  /** Whether the queue repeats the track. */
  public trackRepeat = false;
  /** Whether the queue repeats the queue. */
  public queueRepeat = false;
  /** The loop state of the player */
  public loopState: LoopState = "DISABLED";
  /** The time the player is in the track. */
  public position = 0;
  /** Whether the player is playing. */
  public playing = false;
  /** Whether the player is paused. */
  public paused = false;
  /** Whether the player is playing. */
  public volume: number;
  /** The Node for the Player. */
  public node: Node;
  /** The guild the player. */
  public guild: Guild;
  /** The voice channel for the player. */
  public voiceChannel: VoiceChannel | null = null;
  /** The text channel for the player. */
  public textChannel: TextChannel;
  /** The current state of the player. */
  public state: State = "DISCONNECTED";
  /** The equalizer bands array. */
  public bands = new Array<number>(15).fill(0.0);
  /** The player audio filters */
  public filters: Filters = {};
  /** The voice state object from Discord. */
  public voiceState: VoiceState = Object.assign({});
  /** The Manager. */
  public manager: Manager;
  private static _manager: Manager;
  private readonly data: Record<string, unknown> = {};
  /** InactivityChecker for the player */
  inactivityChecker = new InactivityChecker(this);

  /**
   * Set custom data.
   * @param key
   * @param value
   */
  public set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  /**
   * Get custom data.
   * @param key
   */
  public get<T>(key: string): T {
    return this.data[key] as T;
  }

  /** @hidden */
  public static init(manager: Manager): void {
    this._manager = manager;
  }

  /**
   * Creates a new player, returns one if it already exists.
   * @param options
   */
  constructor(public options: PlayerOptions) {
    if (!this.manager) this.manager = Structure.get("Player")._manager;
    if (!this.manager) throw new RangeError("Manager has not been initiated.");

    if (this.manager.players.has(options.guild.id)) {
      return this.manager.players.get(options.guild.id);
    }

    check(options);

    this.guild = options.guild;

    if (options.voiceChannel) this.voiceChannel = options.voiceChannel;
    this.textChannel = options.textChannel;

    const node = this.manager.nodes.get(options.node);
    this.node = node || this.manager.leastLoadNodes.first();

    if (!this.node) throw new RangeError("No available nodes.");

    this.manager.players.set(options.guild.id, this);
    this.manager.emit("playerCreate", this);
    this.setVolume(options.volume ?? 100);
  }

  /**
   * Same as Manager#search() but a shortcut on the player itself.
   * @param query
   * @param requester
   */
  public search(
    query: string | SearchQuery,
    requester?: GuildMember
  ): Promise<SearchResult> {
    return this.manager.search(query, { requester });
  }

  /**
   * Sets the players equalizer band on-top of the existing ones.
   * @param bands
   */
  public setEQ(...bands: EqualizerBand[]): this {
    // Hacky support for providing an array
    if (Array.isArray(bands[0])) bands = bands[0] as unknown as EqualizerBand[]

    if (!bands.length || !bands.every(
      (band) => JSON.stringify(Object.keys(band).sort()) === '["band","gain"]'
    )
    )
      throw new TypeError("Bands must be a non-empty object array containing 'band' and 'gain' properties.");

    for (const { band, gain } of bands) this.bands[band] = gain;

    this.node.send({
      op: "equalizer",
      guildId: this.guild.id,
      bands: this.bands.map((gain, band) => ({ band, gain })),
    });

    return this;
  }

  /** Clears the equalizer bands. */
  public clearEQ(): this {
    this.bands = new Array(15).fill(0.0);

    this.node.send({
      op: "equalizer",
      guildId: this.guild.id,
      bands: this.bands.map((gain, band) => ({ band, gain })),
    });

    return this;
  }

  /** Connect to the voice channel. */
  public connect(): this {
    if (!this.voiceChannel)
      throw new RangeError("No voice channel has been set.");
    this.state = "CONNECTING";

    /**
     * Server deafen if has permissions and option enabled in player
     */
    if (this.options.serverDeaf && this.voiceChannel.permissionsFor(this.manager.options.client.user)?.has("DEAFEN_MEMBERS")) {
      this.guild.me.voice?.setDeaf(true).catch((err: Error) => this.options.logger?.error(err.message));;
    }

    this.manager.options.send(this.guild.id, {
      op: 4,
      d: {
        guild_id: this.guild.id,
        channel_id: this.voiceChannel.id,
        self_mute: this.options.selfMute || false,
        self_deaf: this.options.selfDeafen || false,
      },
    });

    this.state = "CONNECTED";
    return this;
  }

  /** Disconnect from the voice channel. */
  public disconnect(): this {
    if (this.voiceChannel === null) return this;
    this.inactivityChecker.stop();
    this.state = "DISCONNECTING";

    this.pause(true);
    this.manager.options.send(this.guild.id, {
      op: 4,
      d: {
        guild_id: this.guild.id,
        channel_id: null,
        self_mute: false,
        self_deaf: false,
      },
    });

    this.voiceChannel = null;
    this.state = "DISCONNECTED";
    return this;
  }

  /** Destroys the player. */
  public destroy(): void {
    this.state = "DESTROYING";
    this.inactivityChecker.stop();
    this.disconnect();

    this.node.send({
      op: "destroy",
      guildId: this.guild.id,
    });

    this.manager.emit("playerDestroy", this);
    this.manager.players.delete(this.guild.id);
  }

  /**
   * Sets the player voice channel.
   * @param channel
   */
  public setVoiceChannel(channel: VoiceChannel): this {
    if (!(channel instanceof VoiceChannel))
      throw new TypeError('Channel must be a discord "VoiceChannel".');

    this.voiceChannel = channel;
    this.connect();
    return this;
  }

  /**
   * Sets the player text channel.
   * @param channel
   */
  public setTextChannel(channel: TextChannel): this {
    if (!(channel instanceof TextChannel))
      throw new TypeError('Channel must be a discord "TextChannel".');

    this.textChannel = channel;
    return this;
  }

  /** Plays the next track. */
  public async play(): Promise<void>;

  /**
   * Plays the specified track.
   * @param track
   */
  public async play(track: Track | UnresolvedTrack): Promise<void>;

  /**
   * Plays the next track with some options.
   * @param options
   */
  public async play(options: PlayOptions): Promise<void>;

  /**
   * Plays the specified track with some options.
   * @param track
   * @param options
   */
  public async play(track: Track | UnresolvedTrack, options: PlayOptions): Promise<void>;
  public async play(
    optionsOrTrack?: PlayOptions | Track | UnresolvedTrack,
    playOptions?: PlayOptions
  ): Promise<void> {
    if (
      typeof optionsOrTrack !== "undefined" &&
      TrackUtils.validate(optionsOrTrack)
    ) {
      this.queue.current = optionsOrTrack as Track;
    }

    if (!this.queue.current) throw new RangeError("No current track.");

    const finalOptions = playOptions
      ? playOptions
      : ["startTime", "endTime", "noReplace"].every((v) =>
        Object.keys(optionsOrTrack || {}).includes(v)
      )
        ? (optionsOrTrack as PlayOptions)
        : {};

    if (TrackUtils.isUnresolvedTrack(this.queue.current)) {
      try {
        this.queue.current = await TrackUtils.getClosestTrack(this.queue.current as UnresolvedTrack);
      } catch (error) {
        this.manager.emit("trackError", this, this.queue.current, error);
        if (this.queue[0]) return this.play(this.queue[0]);
        return;
      }
    }

    const options = {
      op: "play",
      guildId: this.guild.id,
      track: this.queue.current.track,
      ...finalOptions,
    };

    if (typeof options.track !== "string") {
      options.track = (options.track as Track).track;
    }

    await this.node.send(options);
  }

  /**
   * Sets the player volume.
   * @param volume
   */
  public setVolume(volume: number): this {
    volume = Number(volume);

    if (isNaN(volume)) throw new TypeError("Volume must be a number.");
    this.volume = Math.max(Math.min(volume, 1000), 0);

    this.node.send({
      op: "volume",
      guildId: this.guild.id,
      volume: this.volume,
    });

    return this;
  }

  /**
   * Sets the track repeat.
   * @param repeat
   */
  public setTrackRepeat(repeat: boolean): this {
    if (typeof repeat !== "boolean")
      throw new TypeError('Repeat can only be "true" or "false".');

    this.loopState = repeat ? 'TRACK' : 'DISABLED';

    if (repeat) {
      this.trackRepeat = true;
      this.queueRepeat = false;
    } else {
      this.trackRepeat = false;
      this.queueRepeat = false;
    }

    return this;
  }

  /**
   * Sets the queue repeat.
   * @param repeat
   */
  public setQueueRepeat(repeat: boolean): this {
    if (typeof repeat !== "boolean")
      throw new TypeError('Repeat can only be "true" or "false".');

    this.loopState = repeat ? 'QUEUE' : 'DISABLED';

    if (repeat) {
      this.trackRepeat = false;
      this.queueRepeat = true;
    } else {
      this.trackRepeat = false;
      this.queueRepeat = false;
    }

    return this;
  }

  /** Skips the current track, optionally give an amount to skip to, e.g 5 would play the 5th song. */
  public skip(amount?: number, addToHistory: boolean = true): this {
    //Add track to queue history
    if (addToHistory) if (this.queue.current) this.queue.previousTracks.unshift(this.queue.current);

    if (typeof amount === "number" && amount > 1) {
      if (amount > this.queue.length) throw new RangeError("Cannot skip more than the queue length.");

      //Add track to queue history
      if (addToHistory) if (amount <= this.queue.length) this.queue.previousTracks.unshift(...(this.queue.slice(0, amount - 1).reverse()));

      this.queue.splice(0, amount - 1);
    }

    this.node.send({
      op: "stop",
      guildId: this.guild.id,
    });

    return this;
  }

  backTo(amount = 0) {
    if (amount < 0) throw new RangeError(`Amount cannot be less than 0`);
    if (amount >= this.queue.previousTracks.length) throw new RangeError(`Amount cannot be more than trackHistory length`);

    const tracksArray = this.queue.current ? [...this.queue.previousTracks.splice(0, amount + 1), this.queue.current] : this.queue.previousTracks.splice(0, amount + 1);
    this.queue.add(tracksArray, 0);
    console.log(this.queue.map(t => t.title).join("\n"));
    !(this.playing && this.queue.current) ? this.play() : this.skip(undefined, false);
    return this;
  }

  /** Stops the player and clears the queue. */
  public stop(addToHistory: boolean = true) {
    this.queue.clear();
    return this.skip(undefined, addToHistory);
  }

  /**
   * Pauses the current track.
   * @param pause
   */
  public pause(pause: boolean): this {
    if (typeof pause !== "boolean")
      throw new RangeError('Pause can only be "true" or "false".');

    // If already paused or the queue is empty do nothing https://github.com/Solaris9/erela.js/issues/58
    if (this.paused === pause || !this.queue.totalSize) return this;

    this.playing = !pause;
    this.paused = pause;

    this.node.send({
      op: "pause",
      guildId: this.guild.id,
      pause,
    });

    return this;
  }

  /**
   * Seeks to the position in the current track.
   * @param position
   */
  public seek(position: number): this {
    if (!this.queue.current) return undefined;
    position = Number(position);

    if (isNaN(position)) {
      throw new RangeError("Position must be a number.");
    }
    if (position < 0 || position > this.queue.current.duration)
      position = Math.max(Math.min(position, this.queue.current.duration), 0);

    this.position = position;
    this.node.send({
      op: "seek",
      guildId: this.guild.id,
      position,
    });

    return this;
  }

  /**
   * Sets the timescale filter.
   * @param {Filters["timescale"]} options Timescale options
   */
  setTimescale({ speed, pitch, rate }: Filters["timescale"] = {}) {
    if (!speed && !pitch && !rate) delete this.filters.timescale;
    else this.filters.timescale = {
      "speed": speed || 1,
      "pitch": pitch || 1,
      "rate": rate || 1
    };

    this.node.send({
      op: "filters",
      guildId: this.guild,
      ...this.filters
    });
  }

  /**
   * Sets the tremolo filter.
   * @param {Filters["tremolo"]} options Tremolo options
   */
  setTremolo({ frequency, depth }: Filters["tremolo"] = {}) {
    if (!depth || !frequency) delete this.filters.tremolo;
    else {
      if (depth > 1 || depth < 0) throw new RangeError("The depth must be between 0 and 1");
      if (frequency > 0) throw new RangeError("The frequency must be grater than 0");
      this.filters.tremolo = {
        "frequency": frequency,
        "depth": depth
      };
    }

    this.node.send({
      op: "filters",
      guildId: this.guild,
      ...this.filters
    });
  }

  /**
   * Sets the rotation filter.
   * @param {Filters["rotation"]} options Rotation options
   */
  setRotation({ rotationHz }: Filters["rotation"] = {}) {
    if (!rotationHz) delete this.filters.rotation;
    else {
      if (rotationHz > 0) throw new RangeError("The rotationHz must be grater than 0");
      this.filters.rotation = {
        "rotationHz": rotationHz || 0
      };
    }

    this.node.send({
      op: "filters",
      guildId: this.guild,
      ...this.filters
    });
  }

  /** Reset all audio filters except eq */
  setFilters(filters: Filters) {
    this.filters = filters;
    this.node.send({
      op: "filters",
      guildId: this.guild,
      ...this.filters
    });
  }
}

export interface Filters {
  timescale?: {
    speed?: number,
    pitch?: number,
    rate?: number
  },
  tremolo?: {
    frequency?: number,
    depth?: number
  },
  rotation?: {
    rotationHz?: number
  }
}

export class InactivityChecker {
  // Class props //
  private _stop: boolean = false;
  times = 0;
  player: Player;
  // Class props //

  constructor(player: Player) {
    this.player = player;
    this.run();
  }

  private run() {
    if (!this._stop && !(this.player.options.guildSettings.music[247] && this.player.options.guildData.premium.isActive())) {
      if (!this.player.playing || (this.player.options.voiceChannel?.members.filter(m => !m.user.bot).size || 0) < 1)
        if (this.times > 1) this.player.manager.emit("playerInactivity", this.player);
        else ++this.times;
    }
    else this.times = 0;
    if (!this._stop) setTimeout(() => this.run(), this.player.options.inactivityTimeout || 500000);
  }

  public stop() {
    this._stop = true;
  }
}

export interface PlayerOptions {
  /** The guild the Player belongs to. */
  guild: Guild;
  /** The text channel the Player belongs to. */
  textChannel: TextChannel;
  /** The voice channel the Player belongs to. */
  voiceChannel: VoiceChannel;
  /** The node the Player uses. */
  node?: string;
  /** The initial volume the Player will use. */
  volume?: number;
  /** If the player should mute itself. */
  selfMute?: boolean;
  /** If the player should deaf itself. */
  selfDeafen?: boolean;
  /** If the player should server deaf itself. */
  serverDeaf?: boolean;
  /** Maximum errors a player can have on a guild in 10 seconds */
  maxErrorsPer10Seconds?: number;
  /** The timeout for the player inactivity */
  inactivityTimeout: number;
  /** The guild data class needed for checking premium */
  guildData: PartialGuildData;
  /** The guild settings class needed for checking 27x7 mode setting */
  guildSettings: PartialGuildSettings;
  /** The client error logger */
  logger?: PartialLogger;
}

/** If track partials are set some of these will be `undefined` as they were removed. */
export interface Track {
  /** The base64 encoded track. */
  readonly track: string;
  /** The title of the track. */
  readonly title: string;
  /** The identifier of the track. */
  readonly identifier: string;
  /** The author of the track. */
  readonly author: string;
  /** The duration of the track. */
  readonly duration: number;
  /** If the track is seekable. */
  readonly isSeekable: boolean;
  /** If the track is a stream.. */
  readonly isStream: boolean;
  /** The uri of the track. */
  readonly uri: string;
  /** The thumbnail of the track or null if it's a unsupported source. */
  readonly thumbnail: string | null;
  /** The user that requested the track. */
  readonly requester: GuildMember;
  /** Unique id for each track */
  readonly uuid: string;
  /** Displays the track thumbnail with optional size or null if it's a unsupported source. */
  displayThumbnail(size?: Sizes): string;
}

/** Unresolved tracks can't be played normally, they will resolve before playing into a Track. */
export interface UnresolvedTrack extends Partial<Track> {
  /** The title to search against. */
  title: string;
  /** The author to search against. */
  author?: string;
  /** The duration to search within 1500 milliseconds of the results from YouTube. */
  duration?: number;
  /** Unique id for each track */
  uuid: string;
  /** The user that requested the track. */
  requester?: GuildMember;
  /** Resolves into a Track. */
  resolve(): Promise<void>;
}

export interface PlayOptions {
  /** The position to start the track. */
  readonly startTime?: number;
  /** The position to end the track. */
  readonly endTime?: number;
  /** Whether to not replace the track if a play payload is sent. */
  readonly noReplace?: boolean;
}

export interface EqualizerBand {
  /** The band number being 0 to 14. */
  band: number;
  /** The gain amount being -0.25 to 1.00, 0.25 being double. */
  gain: number;
}

export interface PartialGuildData {
  premium: {
    isActive(): boolean;
  }
}

export interface PartialGuildSettings {
  music: {
    247: boolean;
  }
}

export interface PartialLogger {
  error(message: string): void;
}