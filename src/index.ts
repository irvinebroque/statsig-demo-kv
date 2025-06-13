/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { CloudflareKVDataAdapter } from 'statsig-node-cloudflare-kv';
import statsig from 'statsig-node';

export interface Env {
	STATSIG_KV: KVNamespace;
	STATSIG_SECRET_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Initialize Statsig with Cloudflare KV adapter
		const dataAdapter = new CloudflareKVDataAdapter(env.STATSIG_KV, 'statsig-YOUR_COMPANY_ID');
		
		await statsig.initialize(
			env.STATSIG_SECRET_KEY,
			{
				dataAdapter: dataAdapter,
				initStrategyForIDLists: 'none',
				disableIdListsSync: true
			}
		);

		const user = {
			userID: crypto.randomUUID(),
		}

		// Example: Check a gate
		const result = statsig.checkGateSync(user, "test_cloudflare_sync");

		statsig.logEvent(
			user,
			"add_to_cart",
			1,
			{
			  price: "9.99",
			  item_name: "diet_coke_48_pack"
			}
		  );
		  

		// Ensure events are flushed
		ctx.waitUntil(statsig.flush(1000));

		return new Response(JSON.stringify({
			message: 'Hello World!',
			gateResult: result
		}), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	},
} satisfies ExportedHandler<Env>;
