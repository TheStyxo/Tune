import React from 'react';
import {
  FaCode,
  FaHeart,
  FaTwitter,
  FaLinkedin,
  FaGithub
} from 'react-icons/fa';
import {
  FooterContainer,
  FooterLinksContainer,
  FooterLinksWrapper,
  FooterLinkItems,
  FooterLink,
  SocialMediaWrap,
  WebsiteRights,
  SocialIcons,
  SocialIconLink
} from './Footer.elements';

function Footer() {
  return (
    <FooterContainer>
      <FooterLinksContainer>
        <FooterLinksWrapper>
          <FooterLinkItems>
            <FooterLink to='/'>TUNE FAQ</FooterLink>
            <FooterLink to='/'>Troubleshooting Guide</FooterLink>
            <FooterLink to='/'>Privacy Policy</FooterLink>
            <FooterLink to='/'>Support server</FooterLink>
            <FooterLink to='/'>Contact us</FooterLink>
          </FooterLinkItems>
        </FooterLinksWrapper>
      </FooterLinksContainer>
      <SocialMediaWrap>
        <SocialIcons>
          <SocialIconLink href='/' target='_blank' aria-label='Github'>
            <FaGithub />
          </SocialIconLink>
          <SocialIconLink href='/' target='_blank' aria-label='Twitter'>
            <FaTwitter />
          </SocialIconLink>
          <SocialIconLink href='/' target='_blank' aria-label='LinkedIn'>
            <FaLinkedin />
          </SocialIconLink>
        </SocialIcons>
        <WebsiteRights>TUNEBOT © 2021</WebsiteRights>
        <WebsiteRights>
          <FaCode style={{ paddingTop: 4 + 'px' }} /> with <FaHeart style={{ paddingTop: 4 + 'px' }} /> by <FooterLink to='\styxo.codes' target='_blank' style={{ color: 'cyan' }}>Styxo#2080</FooterLink>
        </WebsiteRights>
      </SocialMediaWrap>
    </FooterContainer >
  );
}

export default Footer;
