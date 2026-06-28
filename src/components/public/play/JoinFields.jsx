export default function JoinFields({ name, code, setName, setCode }) {
  return (
    <>
      <label>
        Your name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nickname"
          maxLength={20}
          autoComplete="nickname"
        />
      </label>
      <label>
        Room code
        <input
          className="code-input"
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z]/g, '')
                .slice(0, 4),
            )
          }
          placeholder="ABCD"
          maxLength={4}
          autoCapitalize="characters"
        />
      </label>
    </>
  )
}
