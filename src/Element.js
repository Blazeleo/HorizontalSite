import React from 'react'
import  {Parallax, useParallax } from 'react-scroll-parallax'

function Element() {
  const parallax = useParallax<HTMLDivElement>({
    rotateY: [0, 360],
  });
  return (
    <div ref={parallax.ref} className="spinner-border">
      😵‍💫
      <div className="diamond">💎</div>
      <div className="clown">🤡</div>
      <div className="money">💰</div>
      <div className="hand">👌🏻</div>
    </div>
  ); 
}

export {Element}