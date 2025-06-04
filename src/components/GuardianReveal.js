// src/GuardianReveal.js
import React from "react";
import "./App.css"; // Ensure styles for .pillar, .overlay, etc. are here

const characters = [
  { id: 1, name: "Pillar 1", image: "/pillars/pillar_1.png" },
  { id: 2, name: "Pillar 2", image: "/pillars/pillar_2.png" },
  { id: 3, name: "Pillar 3", image: "/pillars/pillar_3.png" },
  { id: 4, name: "Pillar 4", image: "/pillars/pillar_4.png" },
  { id: 5, name: "Pillar 5", image: "/pillars/pillar_5.png" },
  { id: 6, name: "Pillar 6", image: "/pillars/pillar_6.png" },
  { id: 7, name: "Pillar 7", image: "/pillars/pillar_7.png" },
  { id: 8, name: "Pillar 8", image: "/pillars/pillar_8.png" },
  { id: 9, name: "Pillar 9", image: "/pillars/pillar_9.png" },
  { id: 10, name: "Pillar 10", image: "/pillars/pillar_10.png" },
];

export default function GuardianReveal() {
  const handleClick = (id) => {
    alert(`Clicked on ${characters[id - 1].name}`);
  };

  return (
    <div className="guardian-reveal" id="guardians">
      <h2 style={{ color: "white", marginTop: "3rem" }}>Meet the Guardians</h2>
      <div className="pillars">
        {characters.map((char) => (
          <div
            key={char.id}
            className="pillar"
            onClick={() => handleClick(char.id)}
            style={{ backgroundImage: `url(${char.image})` }}
          >
            <div className="overlay">
              <p>{char.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
