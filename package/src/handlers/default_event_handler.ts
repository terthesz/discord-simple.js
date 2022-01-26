import CustomClient from 'client';
import {
  GuildMember,
  Message,
  PartialGuildMember,
  TextChannel,
} from 'discord.js';
import { parse_locale } from '../utils';
import command_handler from './command_handler';
import event_handler from './event_handler';
import interaction_handler from './interaction_handler';

/**
 * A function that handles default package events.
 *
 * @private
 *
 * @param client {CustomClient} The client itself
 */
export default (client: CustomClient) => {
  client.once('ready', () => {
    if (client.set_roles_on_join && !client.join_roles)
      throw new Error('🚫 No join roles provided!');

    if (client.welcomes_and_goodbyes && !client.welcome_channel_id)
      throw new Error('🚫 No welcome channel id provided!');

    if (client._load_commands)
      command_handler(
        client,
        client.guild_id === undefined
          ? undefined
          : client.development_mode || client.guild_only
          ? client.guild_id
          : undefined
      );

    if (client._load_events) event_handler(client);
  });

  if (client.anti_server_advertising) {
    client.on('messageCreate', (message: Message) => {
      if (
        message.member?.id === message.guild?.ownerId ||
        message.member?.permissions.has('ADMINISTRATOR')
      )
        return;

      if (
        message.content.match(
          client.anti_server_advertising_regex ||
            /(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite)\/[^\s/]+?(?=\b)/
        )
      ) {
        message.channel.send('🚫 Please do not advertise servers!');
        message.delete();
      }
    });
  }

  client.on('guildMemberAdd', (member: GuildMember) => {
    if (client.set_roles_on_join) {
      try {
        (client.join_roles as Array<string>).forEach((role) => {
          member.roles.add(role);
        });
      } catch (error) {
        console.log(error);

        console.log(
          "\n\nThe bot's role probably has a lover permission level than the role you want to add to a user or it is placed lower in the role hierarchy."
        );
      }
    }

    if (client.welcomes_and_goodbyes) {
      const channel = client.channels.cache.get(
        client.welcome_channel_id as string
      ) as TextChannel;

      if (!channel) throw new Error('🚫 Welcome channel could not be found.');
      channel.send(
        parse_locale(
          client.locale?.welcome_message ||
            '👋 Welcome to **%guild%**, %user%!',
          {
            member,
            guild: member.guild,
          }
        )
      );
    }
  });

  client.on('guildMemberRemove', (member: GuildMember | PartialGuildMember) => {
    if (client.welcomes_and_goodbyes) {
      const channel = client.channels.cache.get(
        client.welcome_channel_id as string
      ) as TextChannel;

      if (!channel) throw new Error('🚫 Welcome channel could not be found.');
      channel.send(
        parse_locale(
          client.locale?.goodbye_message || '😥 %user% just left us.',
          {
            member,
            guild: member.guild,
          }
        ) || 'Error: No goodbye message provided.'
      );
    }
  });

  client.on('interactionCreate', (interaction) => {
    if (client._load_commands) interaction_handler(interaction, client);
  });

  client.once('error', (error) => {
    console.error(
      `😥 client's WebSocket encountered a connection error: ${error}`
    );
  });

  client.once('disconnect', () => {
    console.log(
      `⛔️ the WebSocket has closed and will no longer attempt to reconnect`
    );
  });
};