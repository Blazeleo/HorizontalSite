import React from "react";
import { Card } from "react-bootstrap";

function DropCard({ref,offsetY}) {
  return (
    <Card style={{
    width: "18rem", 
    transform:`translateX(${offsetY}px)`,
    zIndex:'1',
    position:'absolute',
    justifyContent:'center',
    alignItems:'center'
    }} ref={ref}> 
      <Card.Body>
        <Card.Title>Demo Card</Card.Title>
        <Card.Text>
          Test Card Implementation
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default DropCard;
