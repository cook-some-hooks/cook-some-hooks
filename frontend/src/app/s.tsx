"use client";
import Connect from "../components/connect";
import { useAccount, useDisconnect } from "wagmi";
import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import Link from "next/link";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

type Environment = 'staging' | 'production'

enum SignInScopes {
	OpenID = 'openid',
	Profile = 'profile',
	Email = 'email',
}
// ANCHOR: Create action in dev portal
async function createAction(action: string, isStaging: boolean) {
  await fetch('/api/action', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          action,
          is_staging: isStaging,
      }),
  })
}
export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  console.log(address);

	const {
		register,
		watch,
		formState: { errors },
		control,
	} = useForm<{
		signInScopes: SignInScopes[]
		signInEnvironment: Environment
		testingEnvironment: Environment
		action: string
		verification_level: VerificationLevel
	}>({
		mode: 'all',
		defaultValues: {
			signInScopes: [],
			signInEnvironment: 'production',
			testingEnvironment: 'production',
			action: ("test-action-" + Math.random().toString(36).substring(2, 7)),
			verification_level: VerificationLevel.Orb,
		},
	})
	const signInEnvironment = useWatch({
		control,
		name: 'signInEnvironment',
	})

	const signInScopes = useWatch({
		control,
		name: 'signInScopes',
	})

	const testingEnvironment = useWatch({
		control,
		name: 'testingEnvironment',
	})

	const isTestingWidgetValid = useMemo(
		() => !errors.action && !errors.verification_level,
		[errors.action, errors.verification_level]
	)

	const authLink = useMemo(() => {
		if (
			!process.env.NEXT_PUBLIC_TRY_IT_OUT_APP ||
			!process.env.NEXT_PUBLIC_TRY_IT_OUT_STAGING_APP ||
			!process.env.NEXT_PUBLIC_SIGN_IN_WITH_WORLDCOIN_ENDPOINT
		) {
			return null
		}

		const baseUrl = new URL(`${process.env.NEXT_PUBLIC_SIGN_IN_WITH_WORLDCOIN_ENDPOINT}/authorize`)
		baseUrl.searchParams.append('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`)
		baseUrl.searchParams.append('response_type', 'code')
		baseUrl.searchParams.append('scope', ['openid', ...signInScopes].join(' '))
		baseUrl.searchParams.append('state', signInEnvironment)
		baseUrl.searchParams.append('nonce', Math.random().toString(36).substring(2, 15))

		baseUrl.searchParams.append(
			'client_id',
			signInEnvironment === 'production'
				? process.env.NEXT_PUBLIC_TRY_IT_OUT_APP!
				: process.env.NEXT_PUBLIC_TRY_IT_OUT_STAGING_APP!
		)

		return baseUrl.toString()
	}, [signInEnvironment, signInScopes])


	async function handleVerify(result: ISuccessResult) {
		console.log("Result from IDKit: ", result)

		const res = await fetch('/api/verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				...result,
				action: watch("action"),
				env: watch("testingEnvironment"),
			}),
		})

		const data = await res.json()

		if (res.status == 200) {
			console.log("Successful response from backend:\n", data); // Log the response from our backend for visibility
		} else {
			throw new Error(`Error code ${res.status} (${data.code}): ${data.detail}` ?? "Unknown error."); // Throw an error if verification fails
		}
	}
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p>My dApp</p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <Connect />
        </div>
      </div>
      <div>
        {isConnected && (
          <><button className="border p-2 rounded" onClick={() => disconnect()}>
            Disconnect
          </button><IDKitWidget
            onSuccess={console.log}
            handleVerify={handleVerify}
            action={watch('action') ?? 'test-action'}
            verification_level={watch('verification_level')}
            app_id={testingEnvironment === 'production'
              ? process.env.NEXT_PUBLIC_TRY_IT_OUT_APP! as `app_${string}`
              : process.env.NEXT_PUBLIC_TRY_IT_OUT_STAGING_APP! as `app_${string}`}
            autoClose={false}
          >
              {({ open }) => (
                <div className="relative">
                  <button
                    onClick={() => {
                      // Create action in dev portal when opening IDKit, so precheck succeeds on mobile
                      createAction(watch('action'), testingEnvironment === 'staging');
                      open();
                    } }
                    className={(
                      'flex items-center gap-x-4 transition-all'
                      // variants[styleOption]
                    )}
                    disabled={!isTestingWidgetValid}
                  >
                    {/* <LogoIcon /> */}
                    <span className="text-base leading-normal font-sora font-semibold">
                      Continue with Worldcoin
                    </span>
                  </button>

                  {watch('testingEnvironment') && watch('testingEnvironment') === 'staging' && (
                    <Link
                      className="flex justify-center items-center gap-x-1 mt-3.5 absolute -bottom-8 inset-x-0"
                      href="https://simulator.worldcoin.org/"
                    >
                      <span>Scan with Simulator</span>
                      {/* <RedirectIcon /> */}
                    </Link>
                  )}
                </div>
              )}
            </IDKitWidget></>
        )}
      </div>
      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
        {isConnected ? (
          <div>{address}</div>
        ) : (
          <div>
            <p>please connect lol</p>
          </div>
        )}
      </div>
    </main>
  );
}
