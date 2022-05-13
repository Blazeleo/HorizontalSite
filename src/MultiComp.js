import React from 'react'
import {Parallax, ParallaxProvider} from 'react-scroll-parallax'
import {Element,SlowAndFast} from './Element'

function MultiComp({style}) {
  return (
      <>
      
    <ParallaxProvider>
  <div
    className="w-full flex"
    style={{
      height: '110vh',
      style
    }}
  >
    <div className="w-full flex flex-col items-center">
      <Parallax
        className="Parallax-module__smallLinear--MqSo+"
        shouldAlwaysCompleteAnimation
        translateX={[
          '80px',
          '-80px'
        ]}
      >
        <Element name={0} />
      </Parallax>
     
    </div>
  </div>
</ParallaxProvider>
</>
  )
}

export default MultiComp