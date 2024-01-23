/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import {
  StyleSheet,
  View,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import MlkitOcr, { MlkitOcrResult } from 'react-native-mlkit-ocr';

// utils
let lottery_host = [
  'DONG NAI',
  'CAN THO',
  'DONG THAP',
  'BAC LIEU',
  'AN GIANG',
  'BINH DUONG',
  'BINH PHUOC',
  'BINH THUAN',
  'CA MAU',
  'DA LAT',
  'HAU GIANG',
  'KIEN GIANG',
  'LONG AN',
  'SOC TRANG',
  'TAY NINH',
  'HO CHI MINH',
  'TRA VINH',
  'VINH LONG',
  'VUNG TAU',
  'TIEN GIANG',
  'BEN TRE'
]

let lottery_host_id = [
'XSDN',
'XSCT',
'XSDT',
'XSBL',
'XSAG',
'XDBD',
'XDBP',
'XSBTH',
'XSCM',
'XSDL',
'XSHG',
'XSKG',
'XSLA',
'XSST',
'XSTN',
'XSHCM',
'XSTV',
'XSVL',
'XSVT',
'XSTG',
'XSBTR'
]

function distance(a: string, b: string): number
{
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0)
  {
      return bn;
  }
  if (bn === 0)
  {
      return an;
  }
  const matrix = new Array<number[]>(bn + 1);
  for (let i = 0; i <= bn; ++i)
  {
      let row = matrix[i] = new Array<number>(an + 1);
      row[0] = i;
  }
  const firstRow = matrix[0];
  for (let j = 1; j <= an; ++j)
  {
      firstRow[j] = j;
  }
  for (let i = 1; i <= bn; ++i)
  {
      for (let j = 1; j <= an; ++j)
      {
          if (b.charAt(i - 1) === a.charAt(j - 1))
          {
              matrix[i][j] = matrix[i - 1][j - 1];
          }
          else
          {
              matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1], // substitution
                  matrix[i][j - 1], // insertion
                  matrix[i - 1][j] // deletion
              ) + 1;
          }
      }
  }
  return matrix[bn][an];
}

function hamming_distance(string1: string, string2: string): number { 
  let distance = 0;
  const L = string1.length;
  for (let i = 0; i < L; i++) {
      if (string1[i] !== string2[i]) {
          distance += 1;
      }
  }
  return distance;
}

function* window(fseq: string, window_size: number = 5): Generator<string> {
  for (let i = 0; i < fseq.length - window_size + 1; i++) {
      yield fseq.slice(i, i + window_size);
  }
}

function get_host(line: string): [boolean, string] {
  for (const host of lottery_host) {
      const x = line.toUpperCase().indexOf(host);
      if (x !== -1) {
          return [true, host];
      }
  }
  for (const host of lottery_host) {
      const x = line.toUpperCase();
      if (distance(x, host) < 3) {
          return [true, host];
      }
  }
  for (let i = 0; i < lottery_host_id.length; i++) {
      const host = lottery_host_id[i];
      const x = line.toUpperCase();
      if (x.length >= host.length) {
          for (const seq of window(x, host.length)) {
              if (seq === host) {
                  return [true, lottery_host[i]];
              }
          }
      }
  }
  for (let i = 0; i < lottery_host_id.length; i++) {
      const host = lottery_host_id[i];
      const x = line.toUpperCase();
      if (x.length >= host.length) {
          for (const seq of window(x, host.length)) {
              if (hamming_distance(seq, host) < 1) {
                  return [true, lottery_host[i]];
              }
          }
      }
  }
  return [false, ""];
}



function get_id(line: string): [boolean, string] {
  const pattern = /^\d{6}/;
  const match = line.replace(/\s/g, "").match(pattern);
  if (match) {
      return [true, match[0]];
  }
  return [false, ""];
}

function get_date(line: string): [boolean, string] {
  const pattern = /(\d{2}-\d{2}-\d{4})/;
  const match = line.match(pattern);
  if (match) {
      return [true, match[0]];
  }
  return [false, ""];
}

function removeAccents(str: string) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function post_process(res: any): [string, string, string] {
  let host = ""
  let id = ""
  let date = ""
  for (let i = 0; i < res.length; ++i) {
    let line = removeAccents(res[i].text)
    
    let [host_success, _host] = get_host(line)
    if (host_success) {
      host = _host
    }

    let [id_success, _id] = get_id(line)
    if (id_success) {
      id = _id
    }

    let [date_success, _date] = get_date(line)
    if (date_success) {
      date = _date
    }
  }
  
  console.log(host)
  console.log(id)
  console.log(date)
  return [host, id, date]
}

export default function App() {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<MlkitOcrResult | undefined>();
  const [image, setImage] = React.useState<Asset | undefined>();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      {!!result?.length && (
        <ScrollView
          contentContainerStyle={{
            alignItems: 'stretch',
            padding: 20,
            height: Dimensions.get('window').height,
          }}
          showsVerticalScrollIndicator
          style={styles.scroll}
        >
          {result?.map((block) => {
            let [host, id, date] = post_process(result)
            return block.lines.map((line) => {
              return (
                <View>
                  <Text style={{ fontSize: 50 }}>{host}, {id}, {date}</Text>
                </View>
              );
            });
          })}
        </ScrollView>
      )}

      <Button
        onPress={() => {
          setLoading(true);
          launchGallery(setResult, setImage, setLoading);
        }}
        title="Start"
      />
    </SafeAreaView>
  );
}

function fitWidth(value: number, imageWidth: number) {
  const fullWidth = Dimensions.get('window').width;
  return (value / imageWidth) * fullWidth;
}

function fitHeight(value: number, imageHeight: number) {
  const fullHeight = Dimensions.get('window').height;
  return (value / imageHeight) * fullHeight;
}

function launchGallery(
  setResult: (result: MlkitOcrResult) => void,
  setImage: (result: Asset) => void,
  setLoading: (value: boolean) => void
) {
  launchImageLibrary(
    {
      mediaType: 'photo',
    },
    async ({ assets }) => {
      if (!assets?.[0].uri) {
        throw new Error('oh!');
      }
      try {
        setImage(assets[0]);
        setResult(await MlkitOcr.detectFromUri(assets[0].uri));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 2,
  },
});
