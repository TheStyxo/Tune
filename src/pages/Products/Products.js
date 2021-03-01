import React from 'react';
import { MainSection } from '../../components';
import { homeObjOne, homeObjTwo } from './Data';

function Products() {
  return (
    <>
      <MainSection {...homeObjOne} />
      <MainSection {...homeObjTwo} />
    </>
  );
}

export default Products;
