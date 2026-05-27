{
  pkgs,
  ...
}:

with pkgs;

{
  packages = [
    git
    go-task
    fish
  ];

  languages.javascript = {
    enable = true;
    package = nodejs-slim_24;

    yarn = {
      enable = true;
      package = yarn-berry;
      install.enable = true;
    };
  };
}
