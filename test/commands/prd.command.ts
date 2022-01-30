import { CommandInteraction, GuildMember } from 'discord.js';
import { SimpleClient, SimpleCommand } from '../../src';

export default class PrdCommand extends SimpleCommand {
  name = 'jano';
  description = 'Prints the current date and time. (not really)';

  async execute(interaction: CommandInteraction, client: SimpleClient) {
    await interaction.reply('cauko');

    client.user?.setActivity('cauko', { type: 'WATCHING' });
  }
}
