import React from 'react';
import { objTwo, objThree } from './Data';
import { FeaturesSection } from '../../components';

function Features() {
  return (
    <>
      <FeaturesSection {...objTwo} />
      <FeaturesSection {...objThree} />
    </>
  );
}

export default Features;
