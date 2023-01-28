import type { ForeignComponent, PiletMetadata } from 'piral-core';

export type BlazorRootConfig = [
  root: HTMLDivElement,
  capabilities: Array<string>,
  applyChanges: (pilet: PiletMetadata) => void,
];

export interface BlazorDependencyLoader {
  (config: BlazorRootConfig): Promise<void>;
}

export type WebAssemblyBootResourceType = 'assembly' | 'pdb' | 'dotnetjs' | 'dotnetwasm' | 'globalization' | 'manifest';

export interface WebAssemblyStartOptions {
  /**
   * Overrides the built-in boot resource loading mechanism so that boot resources can be fetched
   * from a custom source, such as an external CDN.
   * @param type The type of the resource to be loaded.
   * @param name The name of the resource to be loaded.
   * @param defaultUri The URI from which the framework would fetch the resource by default. The URI may be relative or absolute.
   * @param integrity The integrity string representing the expected content in the response.
   * @returns A URI string or a Response promise to override the loading process, or null/undefined to allow the default loading behavior.
   */
  loadBootResource?(
    type: WebAssemblyBootResourceType,
    name: string,
    defaultUri: string,
    integrity: string,
  ): string | Promise<Response> | null | undefined;
  /**
   * Override built-in environment setting on start.
   */
  environment?: string;
  /**
   * Gets the application culture. This is a name specified in the BCP 47 format. See https://tools.ietf.org/html/bcp47
   */
  applicationCulture?: string;
}

declare global {
  interface Window {
    Blazor: {
      start(options?: Partial<WebAssemblyStartOptions>): Promise<void>;
      emitNavigateEvent(target: Element, path: string, replace?: boolean): void;
      _internal: {
        navigationManager: any;
        applyHotReload: any;
        NavigationLock: any;
      };
    };
    DotNet: any;
    $blazorLoader: Promise<BlazorRootConfig>;
    $blazorDependencies: Array<{
      name: string;
      url: string;
      count: number;
      promise: Promise<void>;
    }>;
  }
}

declare module 'piral-core/lib/types/custom' {
  interface PiletCustomApi extends PiletBlazorApi {}

  interface PiralCustomComponentConverters<TProps> {
    blazor(component: BlazorComponent): ForeignComponent<TProps>;
  }
}

/**
 * Additional options for the Blazor component
 */
export interface BlazorOptions {
  /**
   * The root path where resources are located
   */
  resourcePathRoot?: string;
}

export interface BlazorComponent {
  /**
   * The name of the Blazor module to render.
   */
  moduleName: string;
  /**
   * The args to transport into activation function.
   */
  args?: Record<string, any>;
  /**
   * An optional dependency that needs to load before
   * the component can be properly displayed.
   */
  dependency?: BlazorDependencyLoader;
  /**
   * The type of the Blazor component.
   */
  type: 'blazor';
  /**
   * Additional options for the Blazor component.
   */
  options?: BlazorOptions;
}

/**
 * Defines the provided set of Blazor Pilet API extensions.
 */
export interface PiletBlazorApi {
  /**
   * Defines the additional libraries (and their symbols) to Blazor via
   * their URLs.
   *
   * @param referenceUrls The URLs pointing to the different DLLs to include.
   */
  defineBlazorReferences(referenceUrls: Array<string>, satellites?: Record<string, Array<string>>): void;
  /**
   * Wraps a Blazor module for use in Piral.
   *
   * @param moduleName The name of the exposed Blazor component.
   * @param args The optional props to use as arguments for the Blazor component.
   * @returns The Piral Blazor component.
   */
  fromBlazor(moduleName: string, args?: Record<string, any>): BlazorComponent;
  /**
   * Defines the additional options to be shared by all Blazor components.
   *
   * @param options The options for the Blazor components.
   */
  defineBlazorOptions(options: BlazorOptions): void;
  /**
   * Releases all defined blazor references from the current pilet.
   */
  releaseBlazorReferences(): void;
}
