type ASPluginConfig = {
  extension: `.${string}`;
  command: string;
  asconfig: `${string}.json`;
};

export default ASPluginConfig;