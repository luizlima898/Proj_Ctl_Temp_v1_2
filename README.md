# Proj_Ctl_Temp_v1_2
Faz parte de uma série de versões, com o objetivo de conectá-lo à nuvem e estabelecer comandos para automatização de eletrodomésticos
em uma residência inteligente. 
Esta versão suporta a conexão com a central ESP32 e é conectada ao sensor de temperatura e umidade DHT22, sendo controlada via Wi-fi da residência. 
Para execucão e verificação da versão:
1. Ir até a pasta do projeto no drive C/Usuario/gusta/Documents/Proj_Ctl_Temp_v1_2 do computador, via prompt comando (bash).
2. No bash iniciar o servidor node.js, server.js, por meio do comando: node server.js. Ir até o navegador e entrar no localhost:3000.
3. Ligar a placa com o ESP32 e o sensor em uma tomada comum, utilizando carregador normal de celular e o fio de alimentação que conecta o ESP32.
4. No index.html gerado deverá aparecer a tabela de leitura de temperatura e umidade, bem como um gráfico representando a variação destes dados de forma aproximada.
Na próxima versão, será estabelecida conexão com eletrodomésticos locais para automação. 
  
