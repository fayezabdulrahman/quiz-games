export default function QuickfireSettings({ diceMode, setDiceMode }) {
  return (
    <div className="host-settings quickfire-settings">
      <div className="settings-heading">
        <div>
          <strong>Handicap die</strong>
          <span>Roll before every card.</span>
        </div>
      </div>
      <div className="quickfire-dice-options">
        <button
          type="button"
          className={diceMode === 'digital' ? 'active' : ''}
          onClick={() => setDiceMode('digital')}
        >
          <strong>Digital die</strong>
          <span>Roll it on the describer’s phone</span>
        </button>
        <button
          type="button"
          className={diceMode === 'manual' ? 'active' : ''}
          onClick={() => setDiceMode('manual')}
        >
          <strong>Physical die</strong>
          <span>Enter the 0, 1 or 2 rolled at home</span>
        </button>
      </div>
    </div>
  )
}
