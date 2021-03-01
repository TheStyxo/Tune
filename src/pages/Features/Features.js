import React from 'react';
import { objOne, objTwo, objThree } from './Data';
import { MainSection, FeaturesSection, Pricing } from '../../components';

function Features() {
  return (
    <>
      <FeaturesSection {...objTwo} />
      <FeaturesSection {...objThree} />
    </>
  );
}

export default Features;
