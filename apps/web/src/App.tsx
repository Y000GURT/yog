function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      Hello world {count}

      <button onClick={() => setCount((count) => count + 1)}>Increment</button>
    </div>
  )
}

export default App
