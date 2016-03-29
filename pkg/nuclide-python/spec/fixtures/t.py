# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the license found in the LICENSE file in
# the root directory of this source tree.

import codecs
import collections

CONST = 42


def check_output(*popenargs, **kwargs):
    return


class MyClass(object):
    def __init(self):
        return


def load_package_configs():
    package_map = {}

    # Performs a depth-first search of the project root for package.json files.
    for (path, dirs, files) in os.walk(PACKAGES_PATH):
        if 'package.json' in files:
            # No need to explore subdirectories once package.json is found.
            del dirs[:]
            package_json = os.path.join(path, 'package.json')
            config = create_config_for_package(package_json)
            # config will be None for packages such as sample packages.
            if config:
                package_name = config['name']
                # Update the map now that the config is complete.
                package_map[package_name] = config

    return package_map

if __name__ == '__main__':
    print json.dumps(ast_to_outline(parse(sys.stdin.read())), indent=4)
