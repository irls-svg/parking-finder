import { useEffect, useState } from "react";
import "./App.css";
import Map from "./components/Map";
import axios from "axios";

function App() {
  const [loading, setLoading] = useState(true);
  const [hitCount, setHitCount] = useState<number>();

  // Fetch hit count from the backend API on component mount — used to demonstrate persistent state
  useEffect(() => {
    async function updateCounter() {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/hit`);
      const hitCount = Number(response.data.hits);
      if (isNaN(hitCount)) return;
      setHitCount(hitCount);
    }
    updateCounter();
    return () => setLoading(false);
  }, []);

  return (
    <>
      <nav>
        <h1 className='font-bold text-zinc-800'>ParkSpace</h1>
      </nav>
      <main>
        <Map />
      </main>
      <footer className='absolute top-0 right-0'>
        <div className='flex rounded-md mx-5 my-4 w-36 h-12 bg-gray-100 items-center justify-center'>
          {loading ? (
            <div className='text-md font-bold'>Loading...</div>
          ) : (
            <div className='text-md font-bold'>{hitCount ? <>Views: {hitCount}</> : <>View count unavailable</>}</div>
          )}
        </div>
      </footer>
    </>
  );
}

export default App;
