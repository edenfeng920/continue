import {
  ContextProviderWithParams,
  ModelDescription,
  SerializedContinueConfig,
  SlashCommandDescription,
} from "../";

export const FREE_TRIAL_MODELS: ModelDescription[] = [
  {
    title: "Claude 3.5 Sonnet (Free Trial)",
    provider: "free-trial",
    model: "claude-3-5-sonnet-latest",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "GPT-4o (Free Trial)",
    provider: "free-trial",
    model: "gpt-4o",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "Llama3.1 70b (Free Trial)",
    provider: "free-trial",
    model: "llama3.1-70b",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
  {
    title: "Codestral (Free Trial)",
    provider: "free-trial",
    model: "codestral-latest",
    systemMessage:
      "You are an expert software developer. You give helpful and concise responses.",
  },
];

export const defaultContextProvidersVsCode: ContextProviderWithParams[] = [
  { name: "code", params: {} },
  { name: "docs", params: {} },
  { name: "diff", params: {} },
  { name: "terminal", params: {} },
  { name: "problems", params: {} },
  { name: "folder", params: {} },
  { name: "codebase", params: {} },
];

export const defaultContextProvidersJetBrains: ContextProviderWithParams[] = [
  { name: "diff", params: {} },
  { name: "folder", params: {} },
  { name: "codebase", params: {} },
];

export const defaultSlashCommandsVscode: SlashCommandDescription[] = [
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "cmd",
    description: "Generate a shell command",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
];

export const defaultSlashCommandsJetBrains = [
  {
    name: "share",
    description: "Export the current chat session to markdown",
  },
  {
    name: "commit",
    description: "Generate a git commit message",
  },
];

export const defaultConfig: SerializedContinueConfig = {
  models: [  
    {
      "title": "Qwen2.5-32B",
      "provider": "openai",
      "model": "CharAI-32B",
      "apiKey": "RPqltRBX7MRICFGKGKxk/w==",
      "apiBase": "http://10.29.180.154:8100/v1",
      "systemMessage": "你是代码专家，你给出的回复简洁有效"
    },
    {
      "title": "DeepSeek-V3",
      "provider": "openai",
      "model": "DeepSeek-V3-doubao",
      "apiKey": "RPqltRBX7MRICFGKGKxk/w==",
      "apiBase": "http://10.29.180.154:8100/v1",
      "systemMessage": "你是代码专家，你给出的回复简洁有效"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Qwen2.5-Coder-14B",
    "provider": "openai",
    "model": "Qwen2.5-Coder-14B",
    "apiKey": "RPqltRBX7MRICFGKGKxk/w==",
    "apiBase": "http://10.29.180.154:8100/v1"
  },
  "embeddingsProvider": {
    "provider": "openai",
    "model": "bce-embedding",
    "apiKey": "RPqltRBX7MRICFGKGKxk/w==",
    "apiBase": "http://10.29.180.154:8100/v1"
  },
  "reranker": {
    "name": "Cangjie",
    "params": {
        "model": "bge-reranker",
        "apiKey": "RPqltRBX7MRICFGKGKxk/w==",
        "apiBase": "http://10.29.180.154:8100/v1"
    }
  },
  contextProviders: defaultContextProvidersVsCode,
  slashCommands: defaultSlashCommandsVscode,
};

export const defaultConfigJetBrains: SerializedContinueConfig = {
  models: [],
  contextProviders: defaultContextProvidersJetBrains,
  slashCommands: defaultSlashCommandsJetBrains,
};
