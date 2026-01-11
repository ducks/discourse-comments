{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_22
    typescript
    python3
    wasm-pack
    cargo
    rustc
  ];

  shellHook = ''
    echo "Discourse Comments Development Environment"
    echo "=========================================="
    echo "Node.js version: $(node --version)"
    echo "TypeScript version: $(tsc --version)"
    echo ""
    echo "Commands:"
    echo "  npm install  - Install dependencies"
    echo "  npm run build - Build TypeScript"
    echo "  npm run dev  - Watch mode"
  '';
}
