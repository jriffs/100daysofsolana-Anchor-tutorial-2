use anchor_lang::prelude::*;

use crate::{Initialize};

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    counter.authority = ctx.accounts.authority.key();
    counter.count = 0;
    Ok(())
}
