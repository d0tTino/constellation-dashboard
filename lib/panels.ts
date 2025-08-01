export interface PanelMetadata {
  id: string;
  title: string;
  module: string;
}

// JSON schema describing the shape of a panel metadata object
export const panelSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    module: { type: 'string' },
  },
  required: ['id', 'title', 'module'],
  additionalProperties: false,
} as const;

const registry: PanelMetadata[] = [
  { id: 'home', title: 'Home Panel', module: '../app/panels/HomePanel' },
  { id: 'about', title: 'About Panel', module: '../app/panels/AboutPanel' },
];

export type LoadedPanel = PanelMetadata & { Component: React.ComponentType<any> };

export async function getPanels(): Promise<LoadedPanel[]> {
  return Promise.all(
    registry.map(async ({ module, ...meta }) => {
      const mod = await import(module);
      return { ...meta, Component: mod.default } as LoadedPanel;
    })
  );
}
