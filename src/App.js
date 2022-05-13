import "./styles.css";
import HorizontalScroll from "react-scroll-horizontal";

export default function App() {
  const child = { width: `12em`, height: `100%` };
  return (
    <div className="App">
      <HorizontalScroll>
        <div style={child}>
          <h1>Hello 1</h1>
        </div>
        <div style={child}>
          <h1>Hello 2</h1>
        </div>

        <div style={child}>
          <h1>Hello 3</h1>
        </div>
      </HorizontalScroll>
    </div>
  );
}
