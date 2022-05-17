import React from 'react'
import  {Parallax, useParallax } from 'react-scroll-parallax'

function Element() {
  const { ref } = useParallax<HTMLDivElement>({ speed: 10 });
  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-8xl text-black font-thin">Hello World!</h1>
      </div>
  ); 
}

export {Element}