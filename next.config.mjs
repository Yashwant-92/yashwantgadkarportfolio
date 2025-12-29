/** @type {import('next').NextConfig} */

const nextConfig = {
	turbopack: {},
	images: {
		qualities: [75, 90, 100],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	allowedDevOrigins: ["*.theopenbuilder.com"],
};

export default nextConfig;
