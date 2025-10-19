import React, { useState } from 'react';

function ChaosMode({ onToggle, isEnabled }) {
  const [delay, setDelay] = useState(500);

  const handleToggle = () => {
    onToggle(!isEnabled, delay);
  };

  const handleDelayChange = (e) => {
    const newDelay = parseInt(e.target.value, 10);
    setDelay(newDelay);
    if (isEnabled) {
      onToggle(true, newDelay);
    }
  };

  return (
    <div className="chaos-mode-container">
      <div className="chaos-mode-header">
        <h3>🎲 Chaos Mode (Optional)</h3>
        <p className="chaos-description">
          Add random network delays to test race conditions
        </p>
      </div>

      <div className="chaos-controls">
        <label className="chaos-toggle">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="chaos-checkbox"
          />
          <span className={`toggle-label ${isEnabled ? 'enabled' : ''}`}>
            {isEnabled ? '✓ Chaos Mode ON' : 'Chaos Mode OFF'}
          </span>
        </label>

        {isEnabled && (
          <div className="chaos-delay-control">
            <label htmlFor="delay-slider">
              Max Delay: <span className="delay-value">{delay}ms</span>
            </label>
            <input
              id="delay-slider"
              type="range"
              min="0"
              max="2000"
              value={delay}
              onChange={handleDelayChange}
              className="delay-slider"
            />
            <p className="chaos-hint">
              Messages will be delayed by 0-{delay}ms randomly. Watch messages
              arrive out of order!
            </p>
          </div>
        )}
      </div>

      <div className="chaos-info">
        <h4>What to expect:</h4>
        <ul>
          <li>Messages arrive out of order due to random delays</li>
          <li>Rapid clicks on the same square still all count</li>
          <li>The server maintains correctness despite message disorder</li>
          <li>This demonstrates why operational transforms are necessary</li>
        </ul>
      </div>
    </div>
  );
}

export default ChaosMode;
