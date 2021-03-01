import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from '../../globalStyles';
import {
  InfoSec,
  InfoRow,
  InfoColumn,
  TextWrapper,
  TopLine,
  Heading,
  Subtitle,
  ImgWrapper,
  Img
} from './FeaturesSection.elements';

function FeaturesSection({
  primary,
  lightBg,
  topLine,
  lightTopLine,
  lightText,
  lightTextDesc,
  headline,
  description,
  buttonLink,
  buttonLabel,
  img,
  png,
  alt,
  imgStart,
  imgRight,
  start
}) {
  const imgAndText = [
    <InfoColumn>
      <ImgWrapper start={start}>
        {img ? <Img src={img} alt={alt} /> : <img alt={alt} >{png}</img>}
      </ImgWrapper>
    </InfoColumn>,
    <InfoColumn>
      <TextWrapper>
        <TopLine lightTopLine={lightTopLine}>{topLine}</TopLine>
        <Heading lightText={lightText}>{headline}</Heading>
        <Subtitle lightTextDesc={lightTextDesc}>{description}</Subtitle>
        {buttonLabel ?
          <Link to={buttonLink}>
            <Button big fontBig primary={primary}>
              {buttonLabel}
            </Button>
          </Link>
          :
          null
        }
      </TextWrapper>
    </InfoColumn>
  ]
  return (
    <>
      <InfoSec lightBg={lightBg}>
        <Container>
          <InfoRow imgStart={imgStart}>
            {imgRight && visualViewport.width > 768 ? imgAndText.reverse() : imgAndText}
          </InfoRow>
        </Container>
      </InfoSec>
    </>
  );
}

export default FeaturesSection;
