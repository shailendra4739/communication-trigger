const axios = require('axios');
const moment=require('moment');
require('dotenv').config()

const package_query=`query($id: uuid!){
    vas_packages_by_pk(id: $id){
        id
        name
        subPackages{
          id
          name
        }
    }
}`

const inser_sub_subsription = `mutation($objects: [vas_sub_subscriptions_insert_input!]! ) {
    insert_vas_sub_subscriptions(objects: $objects) {
      returning {
        id
      }
    }
}`

const update_sub_subsription = `mutation($object: vas_sub_subscriptions_set_input, $id:uuid!){
    update_vas_sub_subscriptions(where:{id:{_eq:$id}},_set:$object){
      affected_rows
      returning{
        id
      }
    }
}`;



exports.handler = async (event, context, cb) => {
    try {

        const { event: { op, data }, table: { name, schema } } = JSON.parse(event.body);
            const { created_by, modified_by, deleted, properties, package_id, apartment_id, start_date, end_date, log_remarks } = data.new;
            
            const $payload = { 
                created_by:  created_by,
                modified_by: modified_by,
                deleted: deleted,
                properties: properties,
                apartment_id: apartment_id,
                start_date: start_date,
                end_date: end_date,
                log_remarks: log_remarks
            }

            const qv = { id: package_id };

            const query_sub_package = JSON.stringify({
                query: package_query,
                variables: qv
            });

            const config = {
                method: 'post',
                url: process.env.HASURA_GQL_URL,
                headers: {
                    'content-type': 'application/json',
                    'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
                },
                data: query_sub_package
            };

            const response = await axios(config);
            const package_response = response.data.data;
            console.log(package_response);

            // const retSubPackages = package_response.vas_packages_by_pk.subPackages[0].id;
            const sub_package_ids = package_response.vas_packages_by_pk?.subPackages.map(subId => subId.id)
            sub_package_ids = [...new Set(sub_package_ids)];
            
            const final_payload=[];
            for(let sub_package_id of sub_package_ids) {
                final_payload.push({...payload, sub_package_id: sub_package_id});
            }
            console.log('final_payload', final_payload)

        if (op === 'INSERT') {

            let insert_data = JSON.stringify({
                query: inser_sub_subsription,
                variables: { objects: $payload }
            });
            
            console.log("insert_data", insert_data)
            console.log("$payload", $payload)

            config.data = insert_data;
            const addSubSubscription = await axios(config);
            console.log(addSubSubscription.data);

        } else if (op === 'UPDATE') {
        
        

            const id = data.old.id;

            let update_data = JSON.stringify({
                query: update_sub_subsription,
                variables: { object: $payload, id: id }
            });
            
            console.log("update id", id)
            
            console.log("update_data", update_data)
            console.log("$payload", $payload)

            config.data = update_data
            const updateSubSubscription = await axios(config);
            console.log(updateSubSubscription.data);
        }

        cb(null, {
            statusCode: 200,
            body: "success"
        });

    }
    catch (err) {
        console.log(err);
    }
}
