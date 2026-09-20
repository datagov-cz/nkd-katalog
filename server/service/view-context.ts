import { NavigationEntry } from "./navigation-service.ts";

/**
 * Context to pass around when rendering the application.
 */
export interface ViewContext {

  language: "cs" | "en";

  t: (serverMessage: string, args?: any) => string;

  /**
   * @deprecated
   */
  navigation: NavigationEntry;

}
