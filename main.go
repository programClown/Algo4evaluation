package main

import (
	"Algo4evaluation/backend/consts"
	"Algo4evaluation/backend/services"
	"context"
	"embed"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

var version = "0.0.0"

func main() {
	// Create an instance of the app structure
	sysSvc := services.System()
	prefSvc := services.Preferences()
	prefSvc.SetAppVersion(version)
	windowWidth, windowHeight, maximised := prefSvc.GetWindowSize()
	windowStartState := options.Normal
	if maximised {
		windowStartState = options.Maximised
	}

	// menu
	appMenu := menu.NewMenu()
	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.AppMenu())
		appMenu.Append(menu.EditMenu())
		appMenu.Append(menu.WindowMenu())
	}

	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:                    "Algo4evaluation",
		Width:                    windowWidth,
		Height:                   windowHeight,
		MinWidth:                 consts.MIN_WINDOW_WIDTH,
		MinHeight:                consts.MIN_WINDOW_HEIGHT,
		WindowStartState:         windowStartState,
		Frameless:                runtime.GOOS != "darwin",
		Menu:                     appMenu,
		EnableDefaultContextMenu: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 0},
		StartHidden:      true,
		OnStartup: func(ctx context.Context) {
			sysSvc.Start(ctx, version)
		},
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
