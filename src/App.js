import "./styles.css";
import HorizontalScroll from "react-scroll-horizontal";
import { Parallax, ParallaxBanner, ParallaxProvider } from "react-scroll-parallax";

export default function App() {
  const child = { width: `60em`, height: `100%` };
  return (
    <div className="App">
      <HorizontalScroll reverseScroll={true}>
        <ParallaxProvider  style={{ height: `100vh`}}>
          <ParallaxBanner
          layers={[
              {
                image :"D:/GitProjs2/hparallax/src/images/bg1.jpeg",
                speed : 10,
              }
            ]}

          style={{height: '100vh',width:`100vh`,aspectRatio: '2 / 1' }}
            />
        <Parallax speed={10}>
        <div style={child}>
          <h1>Hello 2</h1>
        <img src="https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60" alt=""/>
        </div>
        </Parallax>
        <Parallax speed={10}>
        <div style={child}>
          <h1>Hello 3</h1>
        </div>
        </Parallax>
        </ParallaxProvider>
      </HorizontalScroll>
    </div>
  );
}
