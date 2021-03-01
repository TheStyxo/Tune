import React from 'react';
import { MainSection } from '../../components';
import { homeObjOne, homeObjThree } from './Data';

function SignUp() {
  return (
    <>
      <MainSection {...homeObjOne} />
      <MainSection {...homeObjThree} />
    </>
  );
}

export default SignUp;
