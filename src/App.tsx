import { Canvas, CanvasComponent } from "@hunterchen/canvas";

// Define your sections/pages on the canvas
const homeCoordinates = { x: 3000, y: 2000, width: 800, height: 600 };

// Optional: Navigation items for the navbar
const navItems = [
  {
    id: "home",
    label: "Home",
    icon: "Home",
    ...homeCoordinates,
    isHome: true,
  },
  // Add more sections as needed:
  // {
  //   id: "about",
  //   label: "About",
  //   icon: "User",
  //   x: 1500,
  //   y: 2000,
  //   width: 800,
  //   height: 600,
  // },
];

function App() {
  return (
    <Canvas homeCoordinates={homeCoordinates} navItems={navItems}>
      {/* Home Section */}
      <CanvasComponent offset={homeCoordinates}>
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-800">
              Hunter Chen
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Welcome to my personal website
            </p>
          </div>
        </div>
      </CanvasComponent>

      {/* Add more CanvasComponent sections here */}
    </Canvas>
  );
}

export default App;
