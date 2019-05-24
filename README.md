# hiVideo
Customize a player on video using react native is very hard job. It was. hiVideo use the react-native-video as base to build a powerful Video Component.

### Dependencies
- react-native
- react-native-video
- react-native-elements
- react-native-eventemitter

##### Props
* source
* volume
* repeat
* resizeMode
* style
* shouldPlay
* onFullScreen
* outFullScreen
* hidePlayer
* iconPlay
* iconPause
* iconNext
* next
* iconPrev
* prev
* duration
* title
* studio
* cover
* poster
* playerType

###### source
Pode ser um objeto com uri `{uri: 'https://video.url'}`

###### volume
% de volume da mídia recebe um float de 0 até 1

###### repeat
boolean `true` ou `false`

###### resizeMode
none (default), contain, cover, stretch 

###### style
objeto de estilo de View

###### shouldPlay
`true` (default) or `false`

###### onFullScreen (void)
método para ser executado quando o vídeo entrar em fullscreen

###### outFullScreen (void)
método para ser executado quando o vídeo sair de fullscreen

###### hidePlayer
boolean `true` ou `false` (default)

###### iconPlay
Component React com o ícone de play

###### iconPause
Component React com ícone de pause

###### iconNext
Component React com ícone next

###### next (void)
Método para ação ao clicar no botão next vídeo

###### iconPrev
Component React com ícone prev

###### prev (void)
Método para ação ao clicar no botão prev vídeo

###### duration
tempo de duração total da mídia

###### title
Título da mídia

###### studio
Criador da mídia

###### cover
imagem de cover (background do vídeo enquanto ele carrega)

###### poster
imagem de poster do vídeo

###### playerType
Modelo de template utilizado no vídeo
* none (default)
* mute - apenas botão de mute e unmute
* full - full player (todos os botões e recursos disponíveis)