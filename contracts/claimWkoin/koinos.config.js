module.exports = {
  class: "ClaimWkoin",
  proto: [
    "./proto/claimWkoin.proto",
    "./proto/ownable.proto",
    "./proto/common.proto",
  ],
  files: [
    "./ClaimWkoin.ts",
    "./Ownable.ts",
  ],
  sourceDir: "./assembly",
  buildDir: "./build",
  koinosProtoDir: "../../node_modules/koinos-precompiler-as/koinos-proto",
};
