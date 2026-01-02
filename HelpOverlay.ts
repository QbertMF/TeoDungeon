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
    this.overlay.style.maxHeight = '80vh';
    this.overlay.style.overflowY = 'auto';
    this.overlay.style.width = '300px';
    
    this.overlay.innerHTML = `
      <div><strong>KEYBINDINGS</strong> <span style="font-size: 12px; color: #ccc;">(click sections to expand)</span></div>
      <br>
      ${this.createSection('2D Map', [
        'NUM +  : Zoom In',
        'NUM -  : Zoom Out',
        'Shift+NUM + : Increase Map Size',
        'Shift+NUM - : Decrease Map Size',
        'M      : Toggle Map Mode'
      ])}
      ${this.createSection('Map Edit', [
        '3      : Add Triangle Sector',
        '4      : Add Square Sector',
        '5      : Add Pentagon Sector',
        '6      : Add Hexagon Sector',
        '#      : Delete Current Sector',
        'V      : Toggle Ceiling',
        'P      : Print Sectors'
      ])}
      ${this.createSection('Map Edit Wall', [
        '1      : Toggle Wall',
        'R      : Raise Wall Bottom',
        'F      : Lower Wall Bottom',
        'T      : Lower Wall Top',
        'G      : Raise Wall Top',
        'E      : Apply Selected Texture'
      ])}
      ${this.createSection('Movement', [
        'W      : Move Forward',
        'S      : Move Backward',
        'A      : Strafe Left',
        'D      : Strafe Right',
        '←      : Turn Left',
        '→      : Turn Right',
        '↑      : Look Up',
        '↓      : Look Down',
        'Shift+↑: Move Up',
        'Shift+↓: Move Down',
        'Shift+←: Snap Left 45°',
        'Shift+→: Snap Right 45°',
        'Alt+Arrow: Face Wall Perp.',
        'NUM 0  : Reset View',
        'C      : Toggle Collision'
      ])}
      <br>
      <div>?      : Toggle Help</div>
    `;
    
    this.setupCollapsibleSections();
    document.body.appendChild(this.overlay);
  }

  private createSection(title: string, items: string[]): string {
    const id = 'section-' + title.replace(/\s+/g, '').toLowerCase();
    return `
      <div class="help-section">
        <div class="help-header" data-target="${id}" style="cursor: pointer; user-select: none; margin: 5px 0;">
          <span class="toggle-icon">▶</span> <strong>${title}:</strong>
        </div>
        <div id="${id}" class="help-content" style="display: none; margin-left: 15px;">
          ${items.map(item => `<div>${item}</div>`).join('')}
        </div>
      </div>
      <br>
    `;
  }

  private setupCollapsibleSections(): void {
    this.overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('help-header') || target.parentElement?.classList.contains('help-header')) {
        const header = target.classList.contains('help-header') ? target : target.parentElement!;
        const targetId = header.getAttribute('data-target');
        const content = this.overlay.querySelector(`#${targetId}`) as HTMLElement;
        const icon = header.querySelector('.toggle-icon') as HTMLElement;
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          icon.textContent = '▼';
        } else {
          content.style.display = 'none';
          icon.textContent = '▶';
        }
      }
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.overlay.style.display = this.visible ? 'block' : 'none';
  }
}