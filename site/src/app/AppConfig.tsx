export class AppConfig {
  public static siteName = 'To Savor Things';
  public static secretPassword = 'ploy';

  public static token = {
    id: 'fdt',
    symbol: 'FDT',
    enabled: true
  }

  public static coin = {
    id: 'coin',
    enabled: false
  }

  public static menu = [
    {
      text: 'Home',
      icon: 'home',
      to: '/',
      loggedIn: false
    },
    {
      text: 'Activity',
      icon: 'activity',
      to: '/activity',
      loggedIn: false
    },
    {
      text: 'Topics',
      icon: 'topics',
      to: '/topics',
      loggedIn: false
    },
    {
      text: 'Missions',
      icon: 'missions',
      to: '/missions',
      loggedIn: true
    },
    {
      text: 'Shop',
      icon: 'shop',
      to: '/shop',
      loggedIn: true
    },
  ];

  public static dreams = [
    {
      name: 'Astronaut',
      text: 'You will seeing the amazing view and discover, explore the new things. (Need to update)',
      icon: '/astronaut.png',
      image: '/astronaut-bg.jpg',
    },
    {
      name: 'Botanist',
      text: 'A botanist, plant scientist or phytologist is a scientist who specialises in this field. (Need to update)',
      icon: '/botanist.png',
      image: '/botanist-bg.jpg',
    },
    {
      name: 'Train Driver',
      text: 'Train drivers must follow certain guidelines for driving a train safely. (Need to update)',
      icon: '/train-driver.png',
      image: '/train-driver-bg.jpg',
    },
    {
      name: 'Rocket',
      text: 'Rocket Engineer. (Need to update)',
      icon: '/rocket.png',
      image: '/rocket-bg.png',
    },
    {
      name: 'Robot',
      text: 'Robot Engineer. (Need to update)',
      icon: '/robot.png',
      image: '/robot-bg.jpg',
    },
    {
      name: 'Doctor',
      text: 'Save life. (Need to update)',
      icon: '/doctor.png',
      image: '/doctor-bg.jpg',
    },
  ];
}