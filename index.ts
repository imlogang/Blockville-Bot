

import { APIApplicationCommandOption, ApplicationCommandOptionType } from "discord-api-types";
import { ApplicationCommandPermissionsManager, CacheType, CommandInteraction, CommandInteractionOption, CommandInteractionOptionResolver, DataResolver, Interaction, Options, ThreadChannel } from "discord.js";

const axios = require('axios');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// export interface Option {
//   type: number;
//   name: string;
//   description: string;
//   required?: boolean
// }

export interface OptionMapped {
  type: ApplicationCommandOptionType
  get: (resolver: Omit<CommandInteractionOptionResolver<CacheType>, 'getMessage' | 'getFocused'>) => Function
}

const optionMap: OptionMapped[] = [
  {
    type: ApplicationCommandOptionType.Subcommand,
    get: (resolver) => resolver.getSubcommand
  },
  {
    type: ApplicationCommandOptionType.SubcommandGroup,
    get: (resolver) => resolver.getSubcommandGroup
  },
  {
    type: ApplicationCommandOptionType.String,
    get: (resolver) => resolver.getString
  },
  {
    type: ApplicationCommandOptionType.Integer,
    get: (resolver) => resolver.getInteger
  },
  {
    type: ApplicationCommandOptionType.Boolean,
    get: (resolver) => resolver.getBoolean
  },
  {
    type: ApplicationCommandOptionType.User,
    get: (resolver) => resolver.getUser
  },
  {
    type: ApplicationCommandOptionType.Channel,
    get: (resolver) => resolver.getChannel
  },
  {
    type: ApplicationCommandOptionType.Role,
    get: (resolver) => resolver.getRole
  },
  {
    type: ApplicationCommandOptionType.Mentionable,
    get: (resolver) => resolver.getNumber
  },
]

export interface Command {
  description: string;
  action: (params?: object | null) => string | Promise<string>;
  admin?: boolean;
  options?: APIApplicationCommandOption[]
};

const pteroToken = '6Kd9fkDnou3T0XyycPgMUbZS1JWJQtrbO144AaeZo6SqjSOO';
const config = { headers: { Authorization: `Bearer ${pteroToken}` } }

const postPtero = (endpoint: string, data?: any, onsuccess?: string) => {
  return new Promise<string>((resolve, reject) => {
    axios.post(`${pteroAPI}/${endpoint}`, data, config).then((response: any) => {
      resolve(JSON.stringify(onsuccess))
    }).catch((response: any) => {
      resolve(`Command failed: ${response.message}`)
    })
  })
}

const commandRegistry: { [key: string]: Command } = {
  'mc-command': {
    description: 'Trigger an MC Command. duh.',
    admin: true,
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'command',
        description: 'Command and Attributes to execute on the Minecraft Server.',
        required: true
      }
    ],
    action: async (params) => postPtero(`/command`, params, 'jeff')
  },
  reinstall: {
    description: 'Reinstalls Specified Server',
    admin: true,
    action: async (params) => postPtero(`/settings/reinstall`, undefined, 'jeff')
  },
  'list-servers': {
    description: 'Lists all severs.',
    action: (params) => {
      return new Promise<string>((resolve, reject) => {
        axios.get(`${listServers}`, config).then((response: any) => {
          const modResponse = response.data.data.map((tomato: any) =>
            `\n${tomato.attributes.name} : ${tomato.attributes.identifier}`
          ).join('\n')

          resolve(modResponse)

        }).catch((response: any) => {
          resolve(`Command failed: ${response.message}`)
        })
      })
    }
  },
  ryan: {
    description: 'ryan a bitch',
    action: () => {
      return 'ryan a bitch'
    }
  }
};

const token = 'OTE2NDkyNzkwMDEwMDg5NTYy.Yaq8bA.YR8tIk9askhfONDGOmeeB-tJSVA';
const rest = new REST({ version: '9' }).setToken(token);
const serverID = '03f3f6b8';
const robServerID = '42a463d8';
const pteroAPI = `http://minecraftdell.logangodsey.com/api/client/servers/`;
const robpteroAPI = `http://minecraftdell.logangodsey.com/api/client/servers/${robServerID}`;
const listServers = 'http://minecraftdell.logangodsey.com/api/client/';

(async () => {
  try {
    const commandList = Object.keys(commandRegistry).map((command) =>
      ({ name: command, description: commandRegistry[command].description, options: commandRegistry[command].options }));
    console.log(`Started refreshing application (/) commands. \n:${JSON.stringify(commandList, null,)}`);

    await rest.put(
      Routes.applicationGuildCommands('916492790010089562', '186924592722477057'),
      {
        body: commandList,
      },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const interCom = interaction as CommandInteraction;

  if (interCom.commandName in commandRegistry) {
    const registeredCommand = commandRegistry[interCom.commandName];

    if (!registeredCommand.admin || interCom.memberPermissions?.has('ADMINISTRATOR', true)) {
      const options = Object.assign({},)
      registeredCommand.options?.map(option => {
        const getter = optionMap.find(mapping => mapping.type === option.type)?.get(interCom.options);

        return getter ? { [option.name]: getter(option.name) } : undefined
      })

      const action = registeredCommand.action(options);
      const result = typeof action === 'string' ? action : await action;

      await interCom.reply(result);
    }
  }
});

client.login(token);