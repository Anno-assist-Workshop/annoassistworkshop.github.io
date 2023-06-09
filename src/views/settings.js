import { create, deleteGame, getGames } from '../data/games.js';
import { getIslands } from '../data/islands.js';
import {html} from '../lib/lit-html.js'
import { createSubmitHandler } from '../util.js';
import { icon } from './partials.js';


const settingsTemplate = (games, user, onCreate, onDelete, onLoad, error) => html `
<h1>Settings Page</h1>
<section class = 'main'>
    ${!user ? html `
    <div>
        <a class = 'link' href = '/login'>Sign in</a> to enable cloud sync
    </div>
    ` : html `
    <div class = 'box'>
       <i class = 'fa-solid fa-user-check'></i> Logged in as ${user.username}. <a class = 'link' href = '/logout'>Logout</a>
    </div>
    <table>
        <thead>
            <tr>
                <th>Game Name</th>
                <th>Controls</th>
            </tr>
        </thead>
        <tbody>
            ${games.length == 0 ? html `
            <tr>
                <td colspan = '2'>No games are recorded</td>
            </tr>
            ` : games.map((g, i) => gameRow(g, onDelete.bind(null, i), onLoad.bind(null, i)))}
        </tbody>
        <tfoot>
            <tr>
                <td colspan = '2'>
                    <form @submit = ${onCreate}>
                    ${error ? html `<p class = 'error'>${error}</p>` : null}
                        <input type = 'text' name = 'name' placeholder = 'New Game Name'>
                        <button class = 'btn'><i class = 'fa-solid fa-plus'></i>Create Game</button>
                    </form>
                </td>
            </tr>
        </tfoot>
    </table>`}   
</section>
`;

const gameRow = (game, onDelete, onLoad) => html `
<tr>
    <td>
        <div class = 'grid'>${game.active ? icon('arrow', 'left') : null}${game.name}</div>
    </td>
    <td>
        <button @click = ${onLoad} class = 'btn'><i class = 'fa-solid fa-download'></i>Load</button>
        <button @click = ${onDelete} class = 'btn'><i class = 'fa-solid fa-trash-can'></i>Delete</button>
    </td>
</tr>
`
export async function settingsView(ctx){

    const games = ctx.user ? await getGames() : [];

    update()

    function update(error){
         if(ctx.game){
            for(let game of games){
                if(game.objectId == ctx.game.objectId){
                    game.active = true;
                }else{
                    game.active = false;
                }
            }          
        }
        ctx.render(settingsTemplate(games, ctx.user, createSubmitHandler(onCreate), onDelete, onLoad, error));
    }


    async function onCreate({name}, form){
        try {
            if(name == ''){
                throw {message: 'Name is required'}
            }
            const gameData = {name};

            const result = await create(gameData);

            Object.assign(gameData, result);
            games.push(gameData)
            
            form.reset()

            update();
        } catch (err) {
           update(err.message);
           err.handled = true;
        }
    }
    async function onDelete(index){
        const game = games[index];

        const choice = confirm('Are you sure?');

        if(choice){
            await deleteGame(game.objectId);
            games.splice(index, 1);
            update()
        }
        
    }

    async function onLoad(index){
        const game = games[index];

        ctx.setGame(game);
        
        const islands = await getIslands(game.objectId);
        ctx.setIslands(islands)

        update();
    }
}
