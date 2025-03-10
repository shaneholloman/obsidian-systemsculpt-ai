import { App, PluginSettingTab } from "obsidian";
import SystemSculptPlugin from "./main";

export interface SystemSculptSettings {
  openAIApiKey: string;
  groqAPIKey: string;
  openRouterAPIKey: string;
  localEndpoint: string;
  anthropicApiKey: string;
  temperature: number;
  showopenAISetting: boolean;
  showgroqSetting: boolean;
  showlocalEndpointSetting: boolean;
  showopenRouterSetting: boolean;
  showAnthropicSetting: boolean;
}

export const DEFAULT_SETTINGS: SystemSculptSettings = {
  openAIApiKey: "",
  groqAPIKey: "",
  openRouterAPIKey: "",
  localEndpoint: "http://localhost:1234",
  anthropicApiKey: "",
  temperature: 0.5,
  showopenAISetting: true,
  showgroqSetting: true,
  showlocalEndpointSetting: true,
  showopenRouterSetting: true,
  showAnthropicSetting: true,
};

export class SystemSculptSettingTab extends PluginSettingTab {
  plugin: SystemSculptPlugin;

  constructor(app: App, plugin: SystemSculptPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    this.renderLinksContainer();
    this.renderTabContainer();

    const searchContainer = containerEl.createDiv(
      "systemsculpt-search-container"
    );
    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: "Search settings...",
      cls: "systemsculpt-settings-search-input",
    });

    const alphaRibbon = containerEl.createDiv("systemsculpt-alpha-ribbon");
    alphaRibbon.createSpan({ text: "SystemSculpt AI is currently in alpha. " });
    const linkEl = alphaRibbon.createEl("a", {
      text: "Click here to report a bug or request a feature.",
      href: "https://systemsculpt.com/submit-issue",
    });
    linkEl.setAttr("target", "_blank");
    linkEl.setAttr("rel", "noopener noreferrer");

    const settingsContainer = this.renderSettingsContainer();

    this.addSearchFunctionality(searchInput, settingsContainer);

    this.showTab("brain");
    this.toggleTabContainer(true); // Ensure tab container is visible on initial load

    // Focus on the search input
    searchInput.focus();
  }

  private addSearchFunctionality(
    searchInput: HTMLInputElement,
    settingsContainer: HTMLElement
  ): void {
    const allSettings: {
      module: string;
      name: string;
      desc: string;
      element: HTMLElement;
    }[] = [];

    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase();
      if (searchTerm === "") {
        // If the search input is empty, refresh the entire settings display
        this.display();
        // Focus on the search input after refreshing
        setTimeout(() => {
          const newSearchInput = this.containerEl.querySelector(
            ".systemsculpt-settings-search-input"
          ) as HTMLInputElement;
          if (newSearchInput) {
            newSearchInput.focus();
          }
        }, 0);
      } else {
        this.filterSettings(searchTerm, allSettings, settingsContainer);
      }
    });

    // Populate allSettings array
    this.populateAllSettings(allSettings, settingsContainer);
  }

  private populateAllSettings(
    allSettings: {
      module: string;
      name: string;
      desc: string;
      element: HTMLElement;
    }[],
    settingsContainer: HTMLElement
  ): void {
    const modules = [
      "brain",
      "tasks",
      "recorder",
      "templates",
      "chat",
      "builder",
      "anki",
      "about",
    ];

    modules.forEach((module) => {
      const moduleContainer = settingsContainer.createDiv(`${module}-settings`);
      moduleContainer.style.display = "block";

      // @ts-ignore
      this.plugin[`${module}Module`].settingsDisplay(moduleContainer);

      moduleContainer.querySelectorAll(".setting-item").forEach((item) => {
        if (item instanceof HTMLElement) {
          const nameEl = item.querySelector(".systemsculpt-setting-item-name");
          const descEl = item.querySelector(
            ".systemsculpt-setting-item-description"
          );
          if (nameEl?.textContent && descEl?.textContent) {
            const settingName = nameEl.textContent.trim();
            if (!settingName.toLowerCase().includes("settings")) {
              allSettings.push({
                module,
                name: settingName,
                desc: descEl.textContent.trim(),
                element: item,
              });
            }
          }
        }
      });
    });
  }

  private filterSettings(
    searchTerm: string,
    allSettings: {
      module: string;
      name: string;
      desc: string;
      element: HTMLElement;
    }[],
    settingsContainer: HTMLElement
  ): void {
    const searchTerms = searchTerm
      .split(/\s+/)
      .filter((term) => term.length > 0);

    // Clear all existing settings
    settingsContainer.empty();

    allSettings.forEach((setting) => {
      const nameMatches = searchTerms.every((term) =>
        setting.name.toLowerCase().includes(term.toLowerCase())
      );
      const descMatches = searchTerms.every((term) =>
        setting.desc.toLowerCase().includes(term.toLowerCase())
      );

      if (nameMatches || descMatches) {
        // Append the original setting element to the container
        settingsContainer.appendChild(setting.element);

        const nameEl = setting.element.querySelector(
          ".systemsculpt-setting-item-name"
        );
        const descEl = setting.element.querySelector(
          ".systemsculpt-setting-item-description"
        );

        if (nameEl) {
          this.highlightText(nameEl as HTMLElement, setting.name, searchTerms);
        }
        if (descEl) {
          this.highlightText(descEl as HTMLElement, setting.desc, searchTerms);
        }
      }
    });

    // Hide the tab container when searching
    this.toggleTabContainer(false);
  }

  private highlightText(
    element: HTMLElement,
    text: string,
    searchTerms: string[]
  ) {
    element.empty();
    if (searchTerms.length === 0) {
      element.textContent = text;
      return;
    }

    const regex = new RegExp(`(${searchTerms.join("|")})`, "gi");
    const parts = text.split(regex);

    parts.forEach((part) => {
      const span = element.createEl("span");
      span.textContent = part;
      if (
        searchTerms.some((term) =>
          part.toLowerCase().includes(term.toLowerCase())
        )
      ) {
        span.addClass("systemsculpt-fuzzy-match");
      }
    });
  }

  private toggleTabContainer(show: boolean): void {
    const tabContainer = this.containerEl.querySelector(
      ".systemsculpt-tab-container"
    );
    if (tabContainer instanceof HTMLElement) {
      tabContainer.style.display = show ? "flex" : "none";
    }
  }

  private renderTabContainer(): HTMLElement {
    const tabContainer = this.containerEl.createDiv(
      "systemsculpt-tab-container"
    );

    this.renderTab(tabContainer, "brain", "Brain");
    this.renderTab(tabContainer, "tasks", "Tasks");
    this.renderTab(tabContainer, "recorder", "Recorder");
    this.renderTab(tabContainer, "templates", "Templates");
    this.renderTab(tabContainer, "chat", "Chat");
    this.renderTab(tabContainer, "builder", "Builder");
    this.renderTab(tabContainer, "anki", "Anki");
    this.renderTab(tabContainer, "about", "About");

    return tabContainer;
  }

  private renderTab(
    tabContainer: HTMLElement,
    tabId: string,
    tabLabel: string
  ): void {
    const tab = tabContainer.createDiv("systemsculpt-tab");
    tab.dataset.tabId = tabId;
    tab.createSpan({ text: tabLabel });
    tab.addEventListener("click", () => this.showTab(tabId));
  }

  private renderLinksContainer(): HTMLElement {
    const linksContainer = this.containerEl.createDiv(
      "systemsculpt-links-container"
    );

    const links = [
      { text: "Website", url: "https://systemsculpt.com" },
      { text: "Patreon", url: "https://www.patreon.com/SystemSculpt" },
      { text: "X/Twitter", url: "https://www.twitter.com/SystemSculpt" },
      { text: "YouTube", url: "https://www.youtube.com/@systemsculpt" },
      { text: "GitHub", url: "https://github.com/systemsculpt" },
    ];

    links.forEach((link) => {
      const linkEl = linksContainer.createEl("a", {
        text: link.text,
        href: link.url,
        cls: "systemsculpt-settings-link",
      });
      linkEl.setAttr("target", "_blank");
      linkEl.setAttr("rel", "noopener noreferrer");
    });

    return linksContainer;
  }

  private renderSettingsContainer(): HTMLElement {
    return this.containerEl.createDiv("systemsculpt-settings-container");
  }

  showTab(tabId: string): void {
    const tabContainer = this.containerEl.querySelector(
      ".systemsculpt-tab-container"
    );
    if (!tabContainer) return;

    const tabs = tabContainer.childNodes;
    const settingsContainer = this.containerEl.querySelector(
      ".systemsculpt-settings-container"
    ) as HTMLElement;
    if (!settingsContainer) return;

    this.setActiveTab(tabs, tabId);

    // Hide all module containers
    const moduleContainers = settingsContainer.querySelectorAll(
      'div[class$="-settings"]'
    );
    moduleContainers.forEach((container) => {
      (container as HTMLElement).style.display = "none";
    });

    // Show the selected module container
    const selectedContainer = settingsContainer.querySelector(
      `.${tabId}-settings`
    ) as HTMLElement;
    if (selectedContainer) {
      selectedContainer.style.display = "block";
      if (tabId === "about") {
        this.plugin.aboutModule.settingsDisplay(selectedContainer);
      }
      if (tabId === "builder") {
        this.plugin.builderModule.settingsDisplay(selectedContainer);
      }
      if (tabId === "anki") {
        this.plugin.ankiModule.settingsDisplay(selectedContainer);
      }
    }
  }

  private setActiveTab(tabs: NodeListOf<ChildNode>, activeTabId: string): void {
    tabs.forEach((tab) => {
      if (tab instanceof HTMLElement && tab.dataset.tabId === activeTabId) {
        tab.classList.add("systemsculpt-active");
      } else if (tab instanceof HTMLElement) {
        tab.classList.remove("systemsculpt-active");
      }
    });
  }
}
