import UIService from "@vertix.gg/bot/src/ui-v2/ui-service";

export class UIServiceMock extends UIService {
    protected static setupCleanWorkerTimer(): void {
        // Do nothing.
    }

    public isSaveHashEnabled(): boolean {
        return false;
    }
}
