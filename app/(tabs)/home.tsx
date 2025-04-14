import React from 'react';
import { useSelector } from 'react-redux';
import { Text, View } from 'tamagui';
import { RootState } from '~/redux/store';
const Home: React.FC = () => {
  const { profile } = useSelector((state: RootState) => state.profile);
  return (
    <View
      flex={1}
      bg="white"
      width="100%"
      paddingHorizontal={30}
      paddingTop={40}
      paddingBottom={85}
      justifyContent="center"
      alignItems="center">
      <Text>{profile?.name}</Text>
    </View>
  );
};

export default Home;
