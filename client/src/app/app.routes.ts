import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { LudoBoardComponent } from './components/ludo-board/ludo-board.component';
import { RoomConnectGenerateComponent } from './components/room-connect-generate/room-connect-generate.component';
import { GameSetupComponent } from './components/game-setup/game-setup.component';
import { BaseComponent } from './components/base/base.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'signup',
        component: SignupComponent,
      },
      {
        path: 'room-connect',
        component: RoomConnectGenerateComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'game-setup',
        component: GameSetupComponent,
        canActivate: [AuthGuard],
      },
      { path: '**', component: HomeComponent }
    ],
  },
  {
    path: 'ludo-board',
    component: LudoBoardComponent,
    canActivate: [AuthGuard],
  },
];
