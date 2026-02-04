"use strict";
/**
 * GitHub Action Entry Point
 *
 * This is the entry point when running as a GitHub Action
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const index_1 = require("./index");
async function run() {
    try {
        // Get inputs from action
        const username = core.getInput('github_user_name', { required: true });
        const token = core.getInput('github_token', { required: true });
        const outputPath = core.getInput('output_path') || 'dist';
        const mineStrategy = (core.getInput('mine_strategy') || 'all-contributions');
        const minePercentage = parseFloat(core.getInput('mine_percentage') || '0.15');
        const animationSpeed = parseInt(core.getInput('animation_speed') || '100');
        core.info(`🎮 Generating minesweeper for ${username}`);
        core.info(`📋 Strategy: ${mineStrategy}`);
        const generator = new index_1.MinesweeperGenerator({
            username,
            token,
            outputPath,
            mineStrategy,
            minePercentage,
            animationSpeed,
        });
        const result = await generator.generate();
        // Set outputs
        core.setOutput('svg_path', result.files[0]);
        core.setOutput('svg_dark_path', result.files[1]);
        core.setOutput('board_size', result.stats.boardSize);
        core.setOutput('total_mines', result.stats.totalMines);
        core.setOutput('moves', result.stats.moves);
        core.setOutput('is_won', result.stats.isWon);
        core.info(`✅ Successfully generated ${result.files.length} files`);
        core.info(`📊 Board: ${result.stats.boardSize}, Mines: ${result.stats.totalMines}`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unexpected error occurred');
        }
    }
}
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxvREFBc0M7QUFDdEMsbUNBQStDO0FBRy9DLEtBQUssVUFBVSxHQUFHO0lBQ2QsSUFBSSxDQUFDO1FBQ0QseUJBQXlCO1FBQ3pCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2RSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksTUFBTSxDQUFDO1FBQzFELE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxtQkFBbUIsQ0FBaUIsQ0FBQztRQUM3RixNQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDO1FBQzlFLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7UUFFM0UsSUFBSSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBRTFDLE1BQU0sU0FBUyxHQUFHLElBQUksNEJBQW9CLENBQUM7WUFDdkMsUUFBUTtZQUNSLEtBQUs7WUFDTCxVQUFVO1lBQ1YsWUFBWTtZQUNaLGNBQWM7WUFDZCxjQUFjO1NBQ2pCLENBQUMsQ0FBQztRQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTFDLGNBQWM7UUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFN0MsSUFBSSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLFFBQVEsQ0FBQyxDQUFDO1FBQ25FLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsWUFBWSxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFeEYsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxDQUFDO2FBQU0sQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUM7QUFFRCxHQUFHLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBHaXRIdWIgQWN0aW9uIEVudHJ5IFBvaW50XHJcbiAqIFxyXG4gKiBUaGlzIGlzIHRoZSBlbnRyeSBwb2ludCB3aGVuIHJ1bm5pbmcgYXMgYSBHaXRIdWIgQWN0aW9uXHJcbiAqL1xyXG5cclxuaW1wb3J0ICogYXMgY29yZSBmcm9tICdAYWN0aW9ucy9jb3JlJztcclxuaW1wb3J0IHsgTWluZXN3ZWVwZXJHZW5lcmF0b3IgfSBmcm9tICcuL2luZGV4JztcclxuaW1wb3J0IHsgTWluZVN0cmF0ZWd5IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBydW4oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIEdldCBpbnB1dHMgZnJvbSBhY3Rpb25cclxuICAgICAgICBjb25zdCB1c2VybmFtZSA9IGNvcmUuZ2V0SW5wdXQoJ2dpdGh1Yl91c2VyX25hbWUnLCB7IHJlcXVpcmVkOiB0cnVlIH0pO1xyXG4gICAgICAgIGNvbnN0IHRva2VuID0gY29yZS5nZXRJbnB1dCgnZ2l0aHViX3Rva2VuJywgeyByZXF1aXJlZDogdHJ1ZSB9KTtcclxuICAgICAgICBjb25zdCBvdXRwdXRQYXRoID0gY29yZS5nZXRJbnB1dCgnb3V0cHV0X3BhdGgnKSB8fCAnZGlzdCc7XHJcbiAgICAgICAgY29uc3QgbWluZVN0cmF0ZWd5ID0gKGNvcmUuZ2V0SW5wdXQoJ21pbmVfc3RyYXRlZ3knKSB8fCAnYWxsLWNvbnRyaWJ1dGlvbnMnKSBhcyBNaW5lU3RyYXRlZ3k7XHJcbiAgICAgICAgY29uc3QgbWluZVBlcmNlbnRhZ2UgPSBwYXJzZUZsb2F0KGNvcmUuZ2V0SW5wdXQoJ21pbmVfcGVyY2VudGFnZScpIHx8ICcwLjE1Jyk7XHJcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uU3BlZWQgPSBwYXJzZUludChjb3JlLmdldElucHV0KCdhbmltYXRpb25fc3BlZWQnKSB8fCAnMTAwJyk7XHJcblxyXG4gICAgICAgIGNvcmUuaW5mbyhg8J+OriBHZW5lcmF0aW5nIG1pbmVzd2VlcGVyIGZvciAke3VzZXJuYW1lfWApO1xyXG4gICAgICAgIGNvcmUuaW5mbyhg8J+TiyBTdHJhdGVneTogJHttaW5lU3RyYXRlZ3l9YCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdlbmVyYXRvciA9IG5ldyBNaW5lc3dlZXBlckdlbmVyYXRvcih7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lLFxyXG4gICAgICAgICAgICB0b2tlbixcclxuICAgICAgICAgICAgb3V0cHV0UGF0aCxcclxuICAgICAgICAgICAgbWluZVN0cmF0ZWd5LFxyXG4gICAgICAgICAgICBtaW5lUGVyY2VudGFnZSxcclxuICAgICAgICAgICAgYW5pbWF0aW9uU3BlZWQsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdlbmVyYXRvci5nZW5lcmF0ZSgpO1xyXG5cclxuICAgICAgICAvLyBTZXQgb3V0cHV0c1xyXG4gICAgICAgIGNvcmUuc2V0T3V0cHV0KCdzdmdfcGF0aCcsIHJlc3VsdC5maWxlc1swXSk7XHJcbiAgICAgICAgY29yZS5zZXRPdXRwdXQoJ3N2Z19kYXJrX3BhdGgnLCByZXN1bHQuZmlsZXNbMV0pO1xyXG4gICAgICAgIGNvcmUuc2V0T3V0cHV0KCdib2FyZF9zaXplJywgcmVzdWx0LnN0YXRzLmJvYXJkU2l6ZSk7XHJcbiAgICAgICAgY29yZS5zZXRPdXRwdXQoJ3RvdGFsX21pbmVzJywgcmVzdWx0LnN0YXRzLnRvdGFsTWluZXMpO1xyXG4gICAgICAgIGNvcmUuc2V0T3V0cHV0KCdtb3ZlcycsIHJlc3VsdC5zdGF0cy5tb3Zlcyk7XHJcbiAgICAgICAgY29yZS5zZXRPdXRwdXQoJ2lzX3dvbicsIHJlc3VsdC5zdGF0cy5pc1dvbik7XHJcblxyXG4gICAgICAgIGNvcmUuaW5mbyhg4pyFIFN1Y2Nlc3NmdWxseSBnZW5lcmF0ZWQgJHtyZXN1bHQuZmlsZXMubGVuZ3RofSBmaWxlc2ApO1xyXG4gICAgICAgIGNvcmUuaW5mbyhg8J+TiiBCb2FyZDogJHtyZXN1bHQuc3RhdHMuYm9hcmRTaXplfSwgTWluZXM6ICR7cmVzdWx0LnN0YXRzLnRvdGFsTWluZXN9YCk7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgICAgICBjb3JlLnNldEZhaWxlZChlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb3JlLnNldEZhaWxlZCgnQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxucnVuKCk7XHJcbiJdfQ==