import React from 'react';
import { objOne, objTwo, objThree } from './Data';
import { MainSection, FeaturesSection } from '../../components';

function Home() {
  return (
    <>
      <MainSection {...objOne} />
      <FeaturesSection {...objTwo} />
      <FeaturesSection {...objThree} />
    </>
  );
}

export default Home;
