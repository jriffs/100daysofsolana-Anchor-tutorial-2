use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod constants;


declare_id!("Hoc6XZ1V9Fu4AEystdYZaoQ7zbo3FHY8uFX1abqrDVUV");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handle_initialize(ctx)
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        instructions::increment::handle_increment(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + state::Counter::INIT_SPACE,
    )]
    pub counter: Account<'info, state::Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, state::Counter>,
    pub authority: Signer<'info>,
}
