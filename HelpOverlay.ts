export class HelpOverlay {
  private overlay: HTMLDivElement;
  private visible: boolean = false;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '20px';
    this.overlay.style.left = '20px';
    this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.overlay.style.color = 'white';
    this.overlay.style.padding = '15px';
    this.overlay.style.fontFamily = 'monospace';
    this.overlay.style.fontSize = '14px';
    this.overlay.style.border = '2px solid white';
    this.overlay.style.zIndex = '2000';
    this.overlay.style.display = 'none';
    
    this.overlay.innerHTML = `
      <div><strong>KEYBINDINGS</strong></div>
      <br>
      <div><strong>2D Map:</strong></div>
      <div>NUM +  : Zoom In</div>
      <div>NUM -  : Zoom Out</div>
      <div>Shift+NUM + : Increase Map Size</div>
      <div>Shift+NUM - : Decrease Map Size</div>
      <div>M      : Toggle Map Mode</div>
      <br>
      <div><strong>Map Edit:</strong></div>
      <div>3      : Add Triangle Sector</div>
      <div>4      : Add Square Sector</div>
      <div>5      : Add Pentagon Sector</div>
      <div>6      : Add Hexagon Sector</div>
      <div>#      : Delete Current Sector</div>
      <div>P      : Print Sectors</div>
      <br>
      <div><strong>Map Edit Wall:</strong></div>
      <div>1      : Toggle Wall</div>
      <div>R      : Raise Wall Bottom</div>
      <div>F      : Lower Wall Bottom</div>
      <div>T      : Lower Wall Top</div>
      <div>G      : Raise Wall Top</div>
      <br>
      <div><strong>Movement:</strong></div>
      <div>W      : Move Forward</div>
      <div>S      : Move Backward</div>
      <div>A      : Strafe Left</div>
      <div>D      : Strafe Right</div>
      <div>←      : Turn Left</div>
      <div>→      : Turn Right</div>
      <div>↑      : Look Up</div>
      <div>↓      : Look Down</div>
      <div>Shift+↑: Move Up</div>
      <div>Shift+↓: Move Down</div>
      <div>Shift+←: Snap Left 45°</div>
      <div>Shift+→: Snap Right 45°</div>
      <div>NUM 0  : Reset View</div>
      <div>C      : Toggle Collision</div>
      <br>
      <div>?      : Toggle Help</div>
    `;
    
    document.body.appendChild(this.overlay);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.overlay.style.display = this.visible ? 'block' : 'none';
  }
}