importScripts(
  'scripts/background/sidepanel-behavior.js',
  'scripts/background/sidepanel-messages.js'
);

EditaBackgroundBehavior.configureSidePanelBehavior();
EditaBackgroundBehavior.registerSidePanelActionHandler();

chrome.runtime.onInstalled.addListener(() => {
  EditaBackgroundBehavior.configureSidePanelBehavior();
});

chrome.runtime.onStartup.addListener(() => {
  EditaBackgroundBehavior.configureSidePanelBehavior();
});

EditaBackgroundMessages.registerSidePanelMessageHandler();
