import "./styles.css";
import { useEffect, useRef, useState } from "react";
import HorizontalScroll from "react-scroll-horizontal";
import DropCard from "./DropCard";
import styled from "styled-components";
import { Parallax, useParallax, ParallaxProvider } from "react-scroll-parallax";
import { Element } from "./Element.js";

export default function App() {
  const Child = styled.div`
    width: 60em;
    height: 100vh;
  `;

  const MainCont = styled.div`
    width: 100vw;
    height: 100vh;
    position: relative;
  `;

  const imageBg =
    "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt962a6518612d78db/6131a93da9655d098c7cd8f0/09082021-Episode-3-Act-II-Overview-Article-Banner.jpg";

  const image2 = "https://wallpaperaccess.com/full/6192217.jpg";

  const ImgCont = styled.div`
    background-image: url(${(props) => props.img});
    left: 0;
    right: 0;
    position: absolute;
    height: 100vh;
    width: 100vw;
    background-size: cover;
  `;

  const [offsetY, setOffsetY] = useState(0);
  const handleScroll = () => {
    setOffsetY(window.pageYOffset);
  };
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  const [htoggle, sethtoggle] = useState(false);

  return (
    <div className="App">
      {/*Uncomment the horizontal scroll component to view the horizontal effect*/}
      {/* <HorizontalScroll reverseScroll={true} id="Toggle"> */}
      <MainCont>
        <div style={{
          display:'flex',
            justifyContent: "center",
            alignItems: "center",
            height:'100vh'
          }}>
        <ImgCont
          img={imageBg}
          style={{ transform: `translateX(${offsetY / 4}px)` }}
        />
        <DropCard
          offsetY={offsetY * 0.54}
          style={{
            justifyContent: "center",
            alignItems: "center",
            inset: "20em",
          }}
        />
        </div>
      </MainCont>

      <Parallax speed={10}>
        <MainCont>
          <ImgCont
            img={image2}
            style={{ transform: `translateX(${offsetY * 0.6}px)` }}
          />
        </MainCont>
      </Parallax>

      <Child style={{ transform: `translateX(${offsetY * 0.2}px)` }}>
        <h1>Lorem Ipsum Dolor Sit Amet</h1>
      </Child>
      {/* </HorizontalScroll> */}
    </div>
  );
}
